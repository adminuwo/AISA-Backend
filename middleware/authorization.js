import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        req.user = null;
        return res.status(401).json({ error: "Invalid token format" });
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(`[AUTH ERROR] JWT Verification Failed: ${error.message}`);
        console.error(`[AUTH ERROR] Header: ${authHeader}`);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

export const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === 'undefined' || token === 'null') {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        // Token present but invalid/expired - treat as guest
        req.user = null;
    }
    next();
};
