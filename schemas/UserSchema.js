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
      // Legacy support for existing isAdmin field
      isAdmin: { type: Boolean, default: false }
    },
    { versionKey: false, timestamps: true }
  );

const User = mongoose.model('User', UserSchema);
export default mongoose.models.User || User;