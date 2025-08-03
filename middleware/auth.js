import AuditLog from '../schemas/AuditLogSchema.js';

// Authentication middleware
export const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).redirect('/login');
    }
    next();
};

// Authorization middleware for specific roles
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        console.log('requireRole middleware - user:', req.session.user?.username);
        console.log('requireRole middleware - user role:', req.session.user?.role);
        console.log('requireRole middleware - allowed roles:', allowedRoles);
        
        if (!req.session.user) {
            console.log('No user session found');
            return res.status(401).redirect('/login');
        }

        const userRole = req.session.user.role;
        
        if (!allowedRoles.includes(userRole)) {
            console.log('User role not in allowed roles');
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        console.log('Authorization passed');
        next();
    };
};

// Specific role checks
export const requireAdministrator = requireRole(['Administrator']);
export const requireRoleA = requireRole(['Administrator', 'Role A']);
export const requireRoleB = requireRole(['Administrator', 'Role A', 'Role B']);

// Audit logging middleware
export const auditLog = (action, resource, details = null) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after response is sent
            if (req.session.user) {
                AuditLog.create({
                    userId: req.session.user._id,
                    username: req.session.user.username,
                    action: action,
                    resource: resource,
                    resourceId: req.params.id || req.body.id || null,
                    details: details,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }).catch(err => console.error('Audit log error:', err));
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// Scope-based authorization for Role A managers
export const requireScopeAccess = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).redirect('/login');
    }

    const userRole = req.session.user.role;
    
    // Administrators have access to everything
    if (userRole === 'Administrator') {
        return next();
    }
    
    // Role A managers can only access their assigned scope
    if (userRole === 'Role A') {
        const userScope = req.session.user.assignedScope;
        const requestedScope = req.params.scope || req.body.scope;
        
        if (userScope && userScope !== requestedScope) {
            return res.status(403).json({ error: 'Access denied to this scope' });
        }
    }
    
    next();
}; 