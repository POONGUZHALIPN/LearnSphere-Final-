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
            // Task 9/10 API verifies credentials and issues the JWT for protected API calls.
            const authResult = await task9AuthRequest('/login', { email, password });
            if (authResult.token) sessionStorage.setItem('token', authResult.token);

            // Establish the existing LearnSphere session used by dashboard and course learning.
            await apiRequest('/login', { method: 'POST', body: { email, password } });

            showToast('Login successful! Redirecting…', 'success');
            setTimeout(() => { window.location.href = '/student-dashboard'; }, 500);
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
});
