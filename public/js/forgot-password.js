document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('requestCodeForm');
    const resetForm = document.getElementById('resetForm');
    const alertBox = document.getElementById('forgotAlert');
    const stepDescription = document.getElementById('stepDescription');
    const dot1 = document.getElementById('dot1');
    const dot2 = document.getElementById('dot2');
    const demoCodeDisplay = document.getElementById('demoCodeDisplay');
    const demoCodeCaption = document.getElementById('demoCodeCaption');

    let currentEmail = '';

    function goToStep2(email) {
        currentEmail = email;
        requestForm.classList.add('d-none');
        resetForm.classList.remove('d-none');
        stepDescription.textContent = `Enter the code sent for ${email}`;
        dot1.classList.remove('active');
        dot2.classList.add('active');
        document.getElementById('code').focus();
    }

    function goToStep1() {
        resetForm.classList.add('d-none');
        requestForm.classList.remove('d-none');
        stepDescription.textContent = "Enter your registered email and we'll send you a reset code";
        dot2.classList.remove('active');
        dot1.classList.add('active');
        hideInlineAlert(alertBox);
        demoCodeDisplay.style.display = 'none';
        demoCodeCaption.style.display = 'none';
    }

    async function requestCode(email) {
        hideInlineAlert(alertBox);
        const submitBtn = document.getElementById('requestCodeSubmit');
        setButtonLoading(submitBtn, true, 'Sending...');
        try {
            const data = await apiRequest('/forgot-password', { method: 'POST', body: { email } });

            if (data.demoCode) {
                // No email server in this demo — show the code directly on screen.
                demoCodeDisplay.textContent = data.demoCode;
                demoCodeDisplay.style.display = '';
                demoCodeCaption.style.display = '';
            } else {
                demoCodeDisplay.style.display = 'none';
                demoCodeCaption.style.display = 'none';
            }

            goToStep2(email);
            showToast('Reset code generated', 'success');
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    }

    requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        requestCode(email);
    });

    document.getElementById('resendCodeBtn').addEventListener('click', () => {
        requestCode(currentEmail);
    });

    document.getElementById('backToStep1').addEventListener('click', (e) => {
        e.preventDefault();
        goToStep1();
    });

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideInlineAlert(alertBox);

        const code = document.getElementById('code').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword.length < 12 || newPassword.length > 72) {
            showInlineAlert(alertBox, 'Password must be between 12 and 72 characters.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showInlineAlert(alertBox, 'Passwords do not match.', 'error');
            return;
        }

        const submitBtn = document.getElementById('resetSubmit');
        setButtonLoading(submitBtn, true, 'Resetting...');
        try {
            await apiRequest('/reset-password', {
                method: 'POST',
                body: { email: currentEmail, code, password: newPassword }
            });
            showToast('Password reset! Please log in.', 'success');
            setTimeout(() => { window.location.href = '/login'; }, 700);
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
            setButtonLoading(submitBtn, false);
        }
    });
});
