document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const alertBox = document.getElementById('adminLoginAlert');
    const submitBtn = document.getElementById('adminLoginSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideInlineAlert(alertBox);

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        setButtonLoading(submitBtn, true, 'Signing in...');
        try {
            const result = await task9AuthRequest('/admin/login', { email, password });
            if (!result.token || result.admin?.role !== 'admin') {
                throw new Error('This account does not have administrator access.');
            }
            sessionStorage.setItem('token', result.token);
            showToast('Welcome back, Admin!', 'success');
            setTimeout(() => { window.location.href = '/admin-dashboard'; }, 500);
        } catch (err) {
            sessionStorage.removeItem('token');
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
});
