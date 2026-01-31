import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { verifyAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * GET /api/admin/helpdesk - Get all support tickets
 * Admin only
 */
router.get('/helpdesk', verifyAdmin, async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 }); // Latest first

        res.status(200).json({ tickets });
    } catch (error) {
        console.error('[ADMIN] Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
});

/**
 * PATCH /api/admin/helpdesk/:id/status - Update ticket status
 * Admin only
 */
router.patch('/helpdesk/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'resolved', 'open', 'in_progress', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.status(200).json({ message: 'Status updated successfully', ticket });
    } catch (error) {
        console.error('[ADMIN] Error updating ticket status:', error);
        res.status(500).json({ error: 'Failed to update ticket status' });
    }
});

/**
 * DELETE /api/admin/helpdesk/:id - Delete a ticket
 * Admin only
 */
router.delete('/helpdesk/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await SupportTicket.findByIdAndDelete(id);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('[ADMIN] Error deleting ticket:', error);
        res.status(500).json({ error: 'Failed to delete ticket' });
    }
});

/**
 * GET /api/admin/helpdesk/stats - Get helpdesk statistics
 * Admin only
 */
router.get('/helpdesk/stats', verifyAdmin, async (req, res) => {
    try {
        const [total, pending, resolved] = await Promise.all([
            SupportTicket.countDocuments(),
            SupportTicket.countDocuments({ status: 'pending' }),
            SupportTicket.countDocuments({ status: 'resolved' })
        ]);

        res.status(200).json({
            stats: {
                total,
                pending,
                resolved,
                open: total - pending - resolved
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
