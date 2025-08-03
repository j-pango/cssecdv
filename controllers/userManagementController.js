import User from '../schemas/UserSchema.js';
import bcrypt from 'bcrypt';
import { requireAdministrator, auditLog } from '../middleware/auth.js';

const userManagementController = {
    // Create new user (Administrator only)
    createUser: async (req, res) => {
        try {
            const { username, email, password, role, assignedScope } = req.body;
            const createdBy = req.session.user._id;

            // Validate role
            if (!['Administrator', 'Role A', 'Role B'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            // Check if username/email already exists
            const existingUser = await User.findOne({ 
                $or: [{ username }, { email }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 13);
            
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                role,
                assignedScope: role === 'Role A' ? assignedScope : null,
                createdBy
            });

            await newUser.save();

            res.status(201).json({ 
                message: 'User created successfully', 
                user: { 
                    _id: newUser._id, 
                    username: newUser.username, 
                    email: newUser.email, 
                    role: newUser.role 
                } 
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Update user role (Administrator only)
    updateUserRole: async (req, res) => {
        try {
            const { userId, role, assignedScope } = req.body;

            if (!['Administrator', 'Role A', 'Role B'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            const updateData = { role };
            if (role === 'Role A') {
                updateData.assignedScope = assignedScope;
            } else {
                updateData.assignedScope = null;
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                updateData,
                { new: true, select: '-password' }
            );

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({ 
                message: 'User role updated successfully', 
                user: updatedUser 
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Deactivate/Activate user (Administrator only)
    toggleUserStatus: async (req, res) => {
        try {
            const { userId } = req.body;
            
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prevent deactivating own account
            if (userId === req.session.user._id) {
                return res.status(400).json({ error: 'Cannot deactivate your own account' });
            }

            user.isActive = !user.isActive;
            await user.save();

            res.status(200).json({ 
                message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
                user: { _id: user._id, username: user.username, isActive: user.isActive }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Get users managed by Role A (for Role A managers)
    getManagedUsers: async (req, res) => {
        try {
            const currentUser = req.session.user;
            let users;

            if (currentUser.role === 'Role A') {
                // Role A can see all Role B users.
                users = await User.find({ role: 'Role B' }, { password: 0 }).populate('createdBy', 'username');
            } else if (currentUser.role === 'Administrator') {
                // Administrators can see all users.
                users = await User.find({}, { password: 0 }).populate('createdBy', 'username');
            } else {
                // This case should not be reached due to the `requireRoleA` middleware
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            
            res.status(200).json({ users });
        } catch (err) {
            console.error('Error in getManagedUsers:', err);
            res.status(500).json({ error: err.message });
        }
    },

    // Assign users to Role A manager
    assignUsersToManager: async (req, res) => {
        try {
            const { managerId, userIds } = req.body;
            
            const manager = await User.findById(managerId);
            if (!manager || manager.role !== 'Role A') {
                return res.status(400).json({ error: 'Invalid manager' });
            }

            // Update manager's managed users
            await User.findByIdAndUpdate(managerId, {
                $addToSet: { managedUsers: { $each: userIds } }
            });

            // Update users' createdBy field
            await User.updateMany(
                { _id: { $in: userIds } },
                { createdBy: managerId }
            );

            res.status(200).json({ message: 'Users assigned to manager successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

export default userManagementController; 