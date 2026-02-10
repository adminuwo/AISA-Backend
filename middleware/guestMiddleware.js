import { v4 as uuidv4 } from 'uuid';
import Guest from '../models/Guest.js';

export const identifyGuest = async (req, res, next) => {
    // If authenticated as user, guest logic is not needed for limits (but session might need it)
    if (req.user) return next();

    let guestId = req.cookies.guest_id;
    const fingerprint = req.headers['x-device-fingerprint'];
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        let guest;

        // 1. Check by guestId cookie
        if (guestId && guestId !== 'undefined' && guestId !== 'null') {
            guest = await Guest.findOne({ guestId });
        }

        // 2. Fallback to fingerprint
        if (!guest && fingerprint) {
            guest = await Guest.findOne({ fingerprint });
            if (guest) guestId = guest.guestId;
        }

        // 3. Fallback to IP (LESS STRICT for session sharing prevention, prefer cookie/fingerprint)
        // If we only have IP, we should be careful. 
        // BETTER: If no cookie/fingerprint, treat as NEW user, do not link by IP alone to avoid "shared office" issues.
        // We will only use IP for rate limiting, not identity.

        /* 
        if (!guest && ip) {
            guest = await Guest.findOne({ ip });
            if (guest) guestId = guest.guestId;
        } 
        */

        // 4. Create new guest if none found
        if (!guest) {
            // New Guest ID
            guestId = `guest_${uuidv4()}`;
            guest = new Guest({
                guestId: guestId,
                fingerprint: fingerprint || `fp_${uuidv4()}`, // Generate fingerprint if missing
                ip: ip,
                sessionIds: []
            });
            await guest.save();
        } else {
            // Update fingerprint/IP if found
            let updated = false;
            // Only update fingerprint if it was missing before, don't overwrite
            if (fingerprint && !guest.fingerprint) {
                guest.fingerprint = fingerprint;
                updated = true;
            }
            // Always update last known IP
            if (ip && guest.ip !== ip) {
                guest.ip = ip;
                updated = true;
            }
            if (updated) await guest.save();
        }

        // Set HttpOnly cookie
        res.cookie('guest_id', guestId, {
            httpOnly: true,
            secure: true, // Always secure for HttpOnly cookies in modern browsers
            sameSite: 'none', // Needed for cross-origin if frontend/backend are on different domains
            maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
        });

        req.guest = guest;
        next();
    } catch (error) {
        console.error('[GUEST MIDDLEWARE ERROR]', error);
        next();
    }
};
