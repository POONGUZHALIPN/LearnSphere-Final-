document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const alertBox = document.getElementById('registerAlert');
    const submitBtn = document.getElementById('registerSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideInlineAlert(alertBox);

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const degree = document.getElementById('degree').value;
        const year = document.getElementById('year').value;
        const course = document.getElementById('course').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showInlineAlert(alertBox, 'Passwords do not match.', 'error');
            return;
        }
        if (password.length < 12 || password.length > 72) {
            showInlineAlert(alertBox, 'Password must be between 12 and 72 characters.', 'error');
            return;
        }

        setButtonLoading(submitBtn, true, 'Creating account...');
        try {
            await task9AuthRequest('/register', {
                name,
                email,
                password,
                department: degree || course || 'General',
                degree,
                year,
                course
            });

            showToast('Account created! Please log in.', 'success');
            setTimeout(() => { window.location.href = '/login'; }, 700);
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
});
