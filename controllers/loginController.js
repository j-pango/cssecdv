import User from './../schemas/UserSchema.js';
import bcrypt from 'bcrypt';
import AuditLog from '../schemas/AuditLogSchema.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

const loginController = {
    getLogin: (req, res) => {
        console.log('getLogin() called');

        try {
            res.status(200).render('login');
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    postLogin: async (req, res) => {
        console.log('postLogin() called');
    
        const { username, password } = req.body;
    
        if (!username || !password) {
            return res.status(400).json({ error: 'There is an empty field.' });
        }
    
        try {
            const user = await User.findOne({ username });
    
            if (!user) {
                return res.status(400).json({ error: 'Invalid username and/or password' });
            }

            if (user.isLocked()) {
                const remainingTimeMs = user.lockoutUntil.getTime() - Date.now();
                const remainingMinutes = Math.ceil(remainingTimeMs / (1000 * 60)); // Time in minutes
                return res.status(403).json({
                    error: `Account locked. Please try again in ${remainingMinutes} minutes.`
                });
            }

            if (!user.isActive) {
                return res.status(400).json({ error: 'Account is deactivated' });
            }
    
            const match = await bcrypt.compare(password, user.password);
    
            if (match) {
                // Update last login
                await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
                user.failedLoginAttempts = 0;
                user.lockoutUntil = null;
                user.lastLogin = new Date();
                await user.save(); 

                req.session.user = { 
                    username: user.username, 
                    _id: user._id,
                    role: user.role,
                    assignedScope: user.assignedScope,
                    managedUsers: user.managedUsers,
                    isAdmin: user.role === 'Administrator' // Legacy support
                };

                // Log successful login
                await AuditLog.create({
                    userId: user._id,
                    username: user.username,
                    action: 'LOGIN',
                    resource: 'AUTH',
                    details: `User logged in successfully`,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.status(200).json({ 
                    message: 'Login successful!', 
                    role: user.role,
                    isAdmin: user.role === 'Administrator'
                });
            } else {
                // Log failed login attempt
                user.failedLoginAttempts += 1;
                console.log(`Failed login attempt for user ${username}. Attempts: ${user.failedLoginAttempts}`);

                if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                    user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000); // Lock for X minutes
                    user.failedLoginAttempts = 0; // Reset count after lockout to allow new attempts after lockout period
                    await user.save(); // Save the lockout state immediately

                    // Log account locked event
                    await AuditLog.create({
                        userId: user._id,
                        username: user.username,
                        action: 'ACCOUNT_LOCKED',
                        resource: 'AUTH',
                        details: `Account locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts`,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    });

                    return res.status(403).json({
                        error: `Too many failed login attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`
                    });
                }

                await user.save(); // Save incremented failed attempts (if not locked)

                // Log failed login attempt
                await AuditLog.create({
                    userId: user._id,
                    username: user.username,
                    action: 'LOGIN_FAILED',
                    resource: 'AUTH',
                    details: `Failed login attempt`,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.status(400).json({ error: 'Invalid username and/or password' });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
    },    
    logout: async (req, res) => {
        console.log('logout() called');

        if (req.session.user) {
            // Log logout
            await AuditLog.create({
                userId: req.session.user._id,
                username: req.session.user.username,
                action: 'LOGOUT',
                resource: 'AUTH',
                details: `User logged out`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        
        req.session.destroy((err) => {
            if(!err) {
                res.status(200).json({ message: 'Logout successful!' });
            } else {
                console.error(err);
                res.status(500).json({ error: err.message });
            }
        });
    }
}

export default loginController;