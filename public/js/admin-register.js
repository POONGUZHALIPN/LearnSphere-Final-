document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminRegisterForm');
    const alertBox = document.getElementById('adminRegisterAlert');
    const submitBtn = document.getElementById('adminRegisterSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideInlineAlert(alertBox);

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const inviteCode = document.getElementById('inviteCode').value.trim();

        if (password !== confirmPassword) {
            showInlineAlert(alertBox, 'Passwords do not match.', 'error');
            return;
        }

        setButtonLoading(submitBtn, true, 'Creating account...');
        try {
            await apiRequest('/admin/register', {
                method: 'POST',
                body: { name, email, password, inviteCode }
            });
            showToast('Admin account created! Please log in.', 'success');
            setTimeout(() => { window.location.href = '/admin-login'; }, 700);
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
            setButtonLoading(submitBtn, false);
        }
    });
});
