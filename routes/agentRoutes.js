import express from "express";
import Agent from "../models/Agents.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authorization.js";

const router = express.Router();

// Get all available agents
router.get("/", verifyToken, async (req, res) => {
    try {
        const agents = await Agent.find();
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch agents" });
    }
});

// Get user's purchased agents
router.post("/get_my_agents", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.body.userId;
        const user = await User.findById(userId).populate('agents');

        if (!user) {
            console.warn(`[AGENT ROUTE] User not found for ID: ${userId}. Returning empty agents.`);
            return res.json({ agents: [] });
        }

        res.json({ agents: user.agents || [] });
    } catch (err) {
        console.error("Error fetching user agents:", err);
        res.status(500).json({ error: "Failed to fetch user agents" });
    }
});

// "Buy" an agent
router.post("/buy", verifyToken, async (req, res) => {
    try {
        const { agentId } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user.agents.includes(agentId)) {
            user.agents.push(agentId);
            await user.save();
        }
        res.json({ success: true, message: "Agent added to your collection" });
    } catch (err) {
        res.status(500).json({ error: "Failed to purchase agent" });
    }
});

export default router;
