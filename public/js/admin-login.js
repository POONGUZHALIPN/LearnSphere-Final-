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
            await apiRequest('/admin/login', { method: 'POST', body: { email, password } });
            showToast('Welcome back, Admin!', 'success');
            setTimeout(() => { window.location.href = '/admin-dashboard'; }, 500);
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
            setButtonLoading(submitBtn, false);
        }
    });
});
