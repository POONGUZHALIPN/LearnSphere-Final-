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
        if (password.length < 8 || password.length > 72) {
            showInlineAlert(alertBox, 'Password must be between 8 and 72 characters.', 'error');
            return;
        }

        setButtonLoading(submitBtn, true, 'Creating account...');
        try {
            // Task 9 API stores a securely hashed student account.
            await task9AuthRequest('/register', {
                name,
                email,
                password,
                department: degree || course || 'General'
            });

            // Keep the existing LearnSphere student dashboard/session working too.
            // The original app stores additional fields (degree/year/course) in its JSON API.
            try {
                await apiRequest('/register', {
                    method: 'POST',
                    body: { name, email, password, degree, year, course }
                });
            } catch (legacyError) {
                // If this email already exists in the legacy app, reuse its account only
                // when the supplied password matches; otherwise show a clear error.
                if (legacyError.status === 409 || /already|exist|registered/i.test(legacyError.message)) {
                    await apiRequest('/login', { method: 'POST', body: { email, password } });
                } else {
                    throw legacyError;
                }
            }

            showToast('Account created! Please log in.', 'success');
            setTimeout(() => { window.location.href = '/login'; }, 700);
        } catch (err) {
            showInlineAlert(alertBox, err.message, 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
});
