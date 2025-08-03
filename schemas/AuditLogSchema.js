import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        action: { type: String, required: true },
        resource: { type: String, required: true },
        resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
        details: { type: String, default: null },
        ipAddress: { type: String, default: null },
        userAgent: { type: String, default: null },
        timestamp: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default mongoose.models.AuditLog || AuditLog; 