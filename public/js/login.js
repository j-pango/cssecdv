import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const showPassword = document.querySelector('.show-password i');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(event.target); // event.target is #login-form
        const username = formData.get('username');
        const password = formData.get('password');

        // Send POST request to /api/login
        fetch(form.action, // URI
            {
                method: form.method, // POST request
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            }
        ).then(async (res) => {
            const result = await res.json();

            if(res.ok) {
                console.log(result.message);
                event.target.reset();

                // Store the role and admin flag in localStorage
                localStorage.setItem('userRole', result.role);
                localStorage.setItem('isAdmin', result.isAdmin);

                window.location.href = '/';
            } else {
                utils.inform(true, `Error logging in: ${result.error}`);
            }
        })
        .catch((err) => { // Catch POST request errors
            utils.inform(true, `Submission failed: ${err}`);
        });
    });

    showPassword.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this;
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});