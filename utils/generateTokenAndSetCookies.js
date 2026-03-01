import jwt from "jsonwebtoken";

/**
 * Generate a JWT and set it as an httpOnly cookie.
 * Token payload:  { id, email, name, planType }
 * planType is stored so middleware can do a quick pre-check,
 * but the real authoritative check ALWAYS re-reads from MongoDB.
 */
export default function generateTokenAndSetCookies(res, id, email, name, planType = 'basic') {
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const tokenEx = (process.env.TOKEN_EX || '7d').trim();

    const token = jwt.sign(
      { id, email, name, planType },
      secret,
      { expiresIn: tokenEx }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
  } catch (err) {
    console.error(`[JWT ERROR] Failed to sign token: ${err.message}`);
    throw err;
  }
}
