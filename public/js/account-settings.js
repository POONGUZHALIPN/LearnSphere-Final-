document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('changePasswordForm');
    const alertBox = document.getElementById('changeAlert');
    const submitBtn = document.getElementById('changeSubmit');
    const backLink = document.getElementById('backToDashboard');

    let role = null;
    try {
        const me = await apiRequest('/me');
        role = me.role;
        document.getElementById('currentUserName').textContent = me.name;
        backLink.href = role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
    } catch (err) {
        // Not logged in as either role — send to student login by default
        window.location.href = '/login';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideInlineAlert(alertBox);

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword.length < 12 || newPassword.length > 72) {
            showInlineAlert(alertBox, 'New password must be between 12 and 72 characters.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showInlineAlert(alertBox, 'New passwords do not match.', 'error');
            return;
        }

        setButtonLoading(submitBtn, true, 'Updating...');
        try {
            await apiRequest('/change-password', {
                method: 'POST',
                body: { currentPassword, newPassword }
            });
            showToast('Password updated successfully!', 'success');
            form.reset();
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
});
