import AuditLog from '../schemas/AuditLogSchema.js';
import User from '../schemas/UserSchema.js';

const auditController = {
    // Get all audit logs (Administrator only)
    getAllLogs: async (req, res) => {
        try {
            const { page = 1, limit = 50, action, resource, username, startDate, endDate } = req.query;
            
            let filter = {};
            
            // Apply filters
            if (action) filter.action = action;
            if (resource) filter.resource = resource;
            if (username) filter.username = { $regex: username, $options: 'i' };
            if (startDate || endDate) {
                filter.timestamp = {};
                if (startDate) filter.timestamp.$gte = new Date(startDate);
                if (endDate) filter.timestamp.$lte = new Date(endDate);
            }

            const logs = await AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('userId', 'username role');

            const total = await AuditLog.countDocuments(filter);

            res.status(200).json({
                logs,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalLogs: total
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Get logs by user (Administrator only)
    getLogsByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const logs = await AuditLog.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await AuditLog.countDocuments({ userId });

            res.status(200).json({
                logs,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalLogs: total
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Get logs by action type (Administrator only)
    getLogsByAction: async (req, res) => {
        try {
            const { action } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const logs = await AuditLog.find({ action })
                .sort({ timestamp: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('userId', 'username role');

            const total = await AuditLog.countDocuments({ action });

            res.status(200).json({
                logs,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalLogs: total
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Get system statistics (Administrator only)
    getSystemStats: async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ isActive: true });
            const totalLogs = await AuditLog.countDocuments();
            
            // Get recent activity (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentLogs = await AuditLog.countDocuments({ timestamp: { $gte: yesterday } });

            // Get logs by action type
            const actionStats = await AuditLog.aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            // Get logs by user role
            const roleStats = await AuditLog.aggregate([
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $group: { _id: '$user.role', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            res.status(200).json({
                totalUsers,
                activeUsers,
                totalLogs,
                recentLogs,
                actionStats,
                roleStats
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Export logs (Administrator only)
    exportLogs: async (req, res) => {
        try {
            const { startDate, endDate, action, resource } = req.query;
            
            let filter = {};
            if (startDate || endDate) {
                filter.timestamp = {};
                if (startDate) filter.timestamp.$gte = new Date(startDate);
                if (endDate) filter.timestamp.$lte = new Date(endDate);
            }
            if (action) filter.action = action;
            if (resource) filter.resource = resource;

            const logs = await AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .populate('userId', 'username role');

            // Convert to CSV format
            const csvData = logs.map(log => ({
                timestamp: log.timestamp,
                username: log.username,
                action: log.action,
                resource: log.resource,
                details: log.details,
                ipAddress: log.ipAddress
            }));

            res.status(200).json({ logs: csvData });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

export default auditController; 