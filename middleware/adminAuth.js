import jwt from "jsonwebtoken";
import userModel from "../models/User.js";

/**
 * Middleware to verify admin access
 * Only allows admin@uwo24.com to access protected routes
 */
export const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Invalid token format" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from database
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Check if user is admin
        if (user.email !== 'admin@uwo24.com') {
            return res.status(403).json({ error: "Access denied. Admin only." });
        }

        req.user = decoded;
        req.adminUser = user;
        next();
    } catch (error) {
        console.error(`[ADMIN AUTH ERROR] ${error.message}`);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
