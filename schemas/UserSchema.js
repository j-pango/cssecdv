import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema(
    {
      username: { type: String, required: true, trim: true, lowercase: true, unique: true },
      email: { type: String, required: true, trim: true, lowercase: true, unique: true },
      password: { type: String, required: true, trim: true },
      orderIds: { type: [ObjectId], default: [] },
      shippingId: { type: ObjectId, default: null },
      role: { 
        type: String, 
        enum: ['Administrator', 'Role A', 'Role B'], 
        default: 'Role B' 
      },
      assignedScope: { type: String, default: null }, // For Role A managers
      managedUsers: { type: [ObjectId], default: [] }, // Users managed by Role A
      createdBy: { type: ObjectId, ref: 'User', default: null }, // Who created this user
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date, default: null },
      isAdmin: { type: Boolean, default: false }, // Legacy support for existing isAdmin field
      failedLoginAttempts: { type: Number, required: true, default: 0},
      lockoutUntil: { type: Date, default: null }, // Null means not locked
      passwordLastChanged: { type: Date, default: Date.now }
    },
    { versionKey: false, timestamps: true }
  );

UserSchema.methods.isLocked = function() {
    return this.lockoutUntil && this.lockoutUntil > Date.now();
};

const User = mongoose.model('User', UserSchema);
export default mongoose.models.User || User;