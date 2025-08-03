import User from '../schemas/UserSchema.js';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middleware/auth.js';

const passwordController = {
    // Change password for any user
    changePassword: async (req, res) => {
        try {
            if (!req.session.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.user._id;

            // Validate input
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ error: 'New passwords do not match' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }

            // Password complexity check
            const pwComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
            if (!pwComplexity.test(newPassword)) {
                return res.status(400).json({ 
                    error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character' 
                });
            }

            // Get user and verify current password
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            // Check if password can be changed
            const oneDay = 24 * 60 * 60 * 1000;
            if (user.passwordLastChanged && (new Date() - new Date(user.passwordLastChanged)) < oneDay) {
                return res.status(400).json({ error: 'You can only change your password once every 24 hours' });
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 13);

            // Update password
            await User.findByIdAndUpdate(userId, {
                password: hashedNewPassword,
                passwordLastChanged: new Date()
            });

            res.status(200).json({ message: 'Password changed successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Administrator can reset any user's password
    resetUserPassword: async (req, res) => {
        try {
            if (!req.session.user || req.session.user.role !== 'Administrator') {
                return res.status(403).json({ error: 'Administrator access required' });
            }

            const { userId, newPassword } = req.body;

            if (!userId || !newPassword) {
                return res.status(400).json({ error: 'User ID and new password are required' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }

            // Password complexity check
            const pwComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
            if (!pwComplexity.test(newPassword)) {
                return res.status(400).json({ 
                    error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character' 
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 13);
            await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

            res.status(200).json({ message: 'User password reset successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

export default passwordController; 