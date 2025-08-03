import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is Administrator
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'Administrator' && userRole !== 'Role A') {
        window.location.href = '/';
        return;
    }

    // Role selection handler
    const roleSelect = document.getElementById('role');
    const scopeGroup = document.getElementById('scope-group');
	
    roleSelect.addEventListener('change', function() {
        if (this.value === 'Role A') {
            scopeGroup.style.display = 'block';
        } else {
            scopeGroup.style.display = 'none';
        }
    });

    // Create user form handler
    const createUserForm = document.getElementById('create-user-form');
    createUserForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role'),
            assignedScope: formData.get('assignedScope') || null
        };

        try {
            const response = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                utils.inform(false, result.message);
                this.reset();
                loadUsers();
            } else {
                utils.inform(true, result.error);
            }
        } catch (err) {
            utils.inform(true, `Failed to create user: ${err}`);
        }
    });

    // Load users
    async function loadUsers() {
        try {
            console.log('Loading users...');
            const response = await fetch('/api/users');
            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                if (result && result.data) {
                    console.log('Users found:', result.data.length);
                    displayUsers(result.data);
                } else {
                    console.error('No users property in response:', result);
                    utils.inform(true, 'Invalid response format from server');
                }
            } else {
                console.error('Server error:', result.error);
                utils.inform(true, result.error || 'Failed to load users');
            }
        } catch (err) {
            console.error('Error loading users:', err);
            utils.inform(true, `Failed to load users: ${err}`);
        }
    }

    // Display users in table
    function displayUsers(users) {
        const userList = document.getElementById('user-list');
        
        // Check if users is undefined, null, or not an array
        if (!users || !Array.isArray(users) || users.length === 0) {
            userList.innerHTML = '<p>No users found</p>';
            return;
        }

        const table = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                            <td>
                                <button onclick="editUser('${user._id}')" class="edit-btn">Edit</button>
                                <button onclick="toggleUserStatus('${user._id}', ${user.isActive})" class="toggle-btn">
                                    ${user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        userList.innerHTML = table;
    }

    // Load audit logs
    async function loadAuditLogs() {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const action = document.getElementById('action-filter').value;

            let url = '/api/audit/logs?';
            if (startDate) url += `startDate=${startDate}&`;
            if (endDate) url += `endDate=${endDate}&`;
            if (action) url += `action=${action}&`;

            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                displayAuditLogs(result.logs);
            } else {
                utils.inform(true, result.error);
            }
        } catch (err) {
            utils.inform(true, `Failed to load audit logs: ${err}`);
        }
    }

    // Display audit logs
    function displayAuditLogs(logs) {
        const auditLogs = document.getElementById('audit-logs');
        
        // Check if logs is undefined, null, or not an array
        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            auditLogs.innerHTML = '<p>No audit logs found</p>';
            return;
        }

        const table = `
            <table class="audit-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Username</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Details</th>
                        <th>IP Address</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.timestamp).toLocaleString()}</td>
                            <td>${log.username}</td>
                            <td>${log.action}</td>
                            <td>${log.resource}</td>
                            <td>${log.details || '-'}</td>
                            <td>${log.ipAddress || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        auditLogs.innerHTML = table;
    }

    // Export logs
    document.getElementById('export-logs').addEventListener('click', async function() {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const action = document.getElementById('action-filter').value;

            let url = '/api/audit/export?';
            if (startDate) url += `startDate=${startDate}&`;
            if (endDate) url += `endDate=${endDate}&`;
            if (action) url += `action=${action}&`;

            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                // Create CSV download
                const csvContent = 'data:text/csv;charset=utf-8,' + 
                    'Timestamp,Username,Action,Resource,Details,IP Address\n' +
                    result.logs.map(log => 
                        `${new Date(log.timestamp).toISOString()},${log.username},${log.action},${log.resource},"${log.details || ''}",${log.ipAddress || ''}`
                    ).join('\n');

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', 'audit_logs.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                utils.inform(true, result.error);
            }
        } catch (err) {
            utils.inform(true, `Failed to export logs: ${err}`);
        }
    });

    // Filter handlers
    document.getElementById('role-filter').addEventListener('change', loadUsers);
    document.getElementById('status-filter').addEventListener('change', loadUsers);
    document.getElementById('start-date').addEventListener('change', loadAuditLogs);
    document.getElementById('end-date').addEventListener('change', loadAuditLogs);
    document.getElementById('action-filter').addEventListener('change', loadAuditLogs);

    // Initial load
    loadUsers();
    loadAuditLogs();
});

// Global functions for user actions
window.editUser = function(userId) {
    // Implement user editing functionality
    console.log('Edit user:', userId);
};

window.toggleUserStatus = async function(userId, currentStatus) {
    try {
        const response = await fetch('/api/users/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        const result = await response.json();

        if (response.ok) {
            utils.inform(false, result.message);
            // Reload users
            location.reload();
        } else {
            utils.inform(true, result.error);
        }
    } catch (err) {
        utils.inform(true, `Failed to toggle user status: ${err}`);
    }
}; 