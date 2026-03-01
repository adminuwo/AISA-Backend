/**
 * ════════════════════════════════════════════════════════
 *  PLAN EXPIRY SERVICE
 *
 *  Runs once per day (every 24 hours):
 *    1. Downgrade all expired PRO / KING users → BASIC
 *    2. Send 2-day expiry warning emails to users
 *       whose plan expires in exactly 2 days
 *
 *  Uses setInterval (no external cron dependency).
 *  Call  startPlanExpiryService()  once from server.js
 * ════════════════════════════════════════════════════════
 */

import User from '../models/User.js';
import { resend } from '../utils/Email.config.js';

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────────────────
//  EMAIL TEMPLATE: 2-day warning
// ─────────────────────────────────────────────────────────
const build2DayWarningEmail = (name, plan, endDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#5555ff 0%,#8888ff 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">AISA™</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;">Artificial Intelligence Super Assistant</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;font-weight:700;">⚠️ Your ${plan.toUpperCase()} plan expires in 2 days</h2>
              <p style="margin:0 0 12px;color:#4a4a6a;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px;color:#4a4a6a;font-size:15px;line-height:1.6;">
                Your <strong>${plan.toUpperCase()} Plan</strong> is set to expire on
                <strong>${new Date(endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              <p style="margin:0 0 24px;color:#4a4a6a;font-size:15px;line-height:1.6;">
                After expiry, your account will automatically switch to the <strong>Basic plan</strong>
                and you will lose access to premium features.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(135deg,#5555ff,#8888ff);">
                    <a href="${process.env.FRONTEND_URL || 'https://aisa.uwo24.com'}/dashboard/pricing"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                      🔄 Renew My Plan Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#9090aa;font-size:13px;line-height:1.5;">
                If you have questions, reply to this email or visit our support page.<br />
                Thank you for being an AISA user!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8fc;padding:20px 40px;text-align:center;border-top:1px solid #e8e8f0;">
              <p style="margin:0;color:#9090aa;font-size:12px;">
                © ${new Date().getFullYear()} AISA™ · All rights reserved<br/>
                You received this because you have an active subscription.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────
//  STEP 1: Downgrade all expired paid plans → basic
// ─────────────────────────────────────────────────────────
const downgradeExpiredPlans = async () => {
    const now = new Date();

    const expired = await User.find({
        plan: { $in: ['pro', 'king'] },
        planEndDate: { $lte: now },
        isExpired: false
    }).select('_id email name plan planEndDate');

    if (expired.length === 0) {
        console.log('[EXPIRY-JOB] No expired plans found.');
        return;
    }

    const ids = expired.map(u => u._id);

    await User.updateMany(
        { _id: { $in: ids } },
        {
            $set: {
                plan: 'basic',
                isExpired: true,
                planExpiredAt: now
            }
        }
    );

    console.log(`[EXPIRY-JOB] Downgraded ${expired.length} user(s) to Basic.`);
    expired.forEach(u =>
        console.log(`  ↓ ${u.email} (was: ${u.plan}, expired: ${u.planEndDate?.toISOString()})`)
    );
};

// ─────────────────────────────────────────────────────────
//  STEP 2: Send 2-day warning emails
// ─────────────────────────────────────────────────────────
const sendExpiryWarnings = async () => {
    const now = new Date();
    // Band: planEndDate is between "now+2days - 1hr" and "now+2days + 1hr"
    // (wide band to ensure one email per day regardless of when cron runs)
    const twoDay = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const banStart = new Date(twoDay.getTime() - 60 * 60 * 1000);
    const banEnd = new Date(twoDay.getTime() + 12 * 60 * 60 * 1000);

    const soon = await User.find({
        plan: { $in: ['pro', 'king'] },
        planEndDate: { $gte: banStart, $lte: banEnd },
        isExpired: false
    }).select('email name plan planEndDate');

    if (soon.length === 0) {
        console.log('[EXPIRY-JOB] No expiry warnings to send today.');
        return;
    }

    console.log(`[EXPIRY-JOB] Sending ${soon.length} 2-day warning email(s)...`);

    for (const user of soon) {
        try {
            await resend.emails.send({
                from: `AISA <${process.env.EMAIL}>`,
                to: [user.email],
                subject: `⚠️ Your AISA ${user.plan.toUpperCase()} plan expires in 2 days`,
                html: build2DayWarningEmail(user.name, user.plan, user.planEndDate)
            });
            console.log(`  ✉️  Warning email sent → ${user.email}`);
        } catch (err) {
            console.error(`  ✗  Failed to email ${user.email}:`, err.message);
        }
    }
};

// ─────────────────────────────────────────────────────────
//  MAIN JOB  (runs both steps)
// ─────────────────────────────────────────────────────────
const runDailyJob = async () => {
    console.log(`\n[EXPIRY-JOB] ▶ Daily subscription job started at ${new Date().toISOString()}`);
    try {
        await downgradeExpiredPlans();
        await sendExpiryWarnings();
    } catch (err) {
        console.error('[EXPIRY-JOB] Unexpected error in daily job:', err);
    }
    console.log(`[EXPIRY-JOB] ✅ Daily job complete.\n`);
};

// ─────────────────────────────────────────────────────────
//  START  (call once from server.js after DB connects)
// ─────────────────────────────────────────────────────────
export const startPlanExpiryService = () => {
    console.log('[EXPIRY-JOB] Plan expiry service initialised — runs every 24 hours.');

    // Run immediately on startup, then repeat every 24 h
    runDailyJob();
    setInterval(runDailyJob, INTERVAL_MS);
};

export { runDailyJob };
