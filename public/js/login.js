document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const alertBox = document.getElementById('loginAlert');
    const submitBtn = document.getElementById('loginSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideInlineAlert(alertBox);

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        setButtonLoading(submitBtn, true, 'Logging in...');
        try {
            const authResult = await task9AuthRequest('/login', { email, password });
            if (!authResult.token) throw new Error('The server did not return an authentication token.');
            sessionStorage.setItem('token', authResult.token);
            showToast('Login successful! Redirecting…', 'success');
            setTimeout(() => { window.location.href = '/student-dashboard'; }, 500);
        } catch (err) {
            sessionStorage.removeItem('token');
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
});
