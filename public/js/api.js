/* LearnSphere — shared front-end API/service utilities */

// API URLs are centralized in config.js so local development and deployed
// environments use the correct backend without hard-coded localhost requests.
const APP_API_BASE = String(window.LEARNSPHERE_CONFIG?.APP_API_BASE_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
const TASK9_API_ROOT = String(window.LEARNSPHERE_CONFIG?.TASK9_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// Task 9 Express authentication API (runs separately on port 5000)
// ---------------------------------------------------------------------------
const TASK9_AUTH_BASE = `${TASK9_API_ROOT}/auth`;

async function task9AuthRequest(path, body) {
    let response;
    try {
        response = await fetch(`${TASK9_AUTH_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (networkError) {
        const err = new Error(
            'Cannot connect to the Task 9 Express API. Start it with: cd backend && npm run dev'
        );
        err.status = 0;
        throw err;
    }

    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
        const err = new Error(data.message || `Authentication request failed (${response.status})`);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}


async function apiRequest(path, options = {}) {
    let res;

    try {
        res = await fetch(APP_API_BASE + path, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(sessionStorage.getItem('token')
                    ? { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
                    : {}),
                ...(options.headers || {})
            },
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined
        });
    } catch (networkError) {
        const err = new Error(
            'Unable to connect to the Mock API. Make sure the backend is running.'
        );
        err.status = 0;
        err.cause = networkError;
        throw err;
    }

    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        // Some successful DELETE/empty responses may not contain JSON.
    }

    if (!res.ok) {
        const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// Small service layer for student CRUD.
// Pages can use these functions instead of writing fetch calls directly.
const studentApi = {
    list: () => apiRequest('/students'),
    get: (id) => apiRequest(`/students/${encodeURIComponent(id)}`),
    create: (student) => apiRequest('/students', {
        method: 'POST',
        body: student
    }),
    update: (id, student) => apiRequest(`/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: student
    }),
    patch: (id, changes) => apiRequest(`/students/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: changes
    }),
    remove: (id) => apiRequest(`/students/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    })
};

const courseApi = {
    list: () => apiRequest('/courses')
};

// Student course application endpoints (existing LearnSphere session API).
const studentCourseApi = {
    catalog: () => apiRequest('/student/course-catalog'),
    apply: (course) => apiRequest('/student/courses/apply', {
        method: 'POST',
        body: { course }
    })
};

// Task 10 helper for authenticated Express course CRUD requests.
async function task10ApiRequest(path, options = {}) {
    const token = sessionStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${TASK9_API_ROOT}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
        const err = new Error(data.message || `Request failed (${response.status})`);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
    }
    return stack;
}

function showToast(message, type = 'success') {
    const stack = ensureToastStack();
    const item = document.createElement('div');
    item.className = `toast-item ${type}`;
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
    item.innerHTML = `<i class="bi ${icon}"></i><span>${message}</span>`;
    stack.appendChild(item);
    setTimeout(() => {
        item.style.transition = 'opacity .3s, transform .3s';
        item.style.opacity = '0';
        item.style.transform = 'translateX(30px)';
        setTimeout(() => item.remove(), 300);
    }, 3200);
}

// ---------------------------------------------------------------------------
// Inline alert banner (used inside auth cards for form-level errors)
// ---------------------------------------------------------------------------
function showInlineAlert(el, message, type = 'error') {
    if (!el) return;
    el.textContent = message;
    el.className = `alert-inline ${type} show`;
}

function hideInlineAlert(el) {
    if (!el) return;
    el.className = 'alert-inline';
}

// ---------------------------------------------------------------------------
// Button loading state
// ---------------------------------------------------------------------------
function setButtonLoading(btn, loading, loadingText = 'Please wait...') {
    if (!btn) return;
    if (loading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
    } else {
        btn.disabled = false;
        if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-logout]').forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            sessionStorage.removeItem('token');
            try {
                await apiRequest('/logout', { method: 'POST' });
            } catch (err) {
                // Redirect even if the server is already unavailable.
            }
            window.location.href = el.dataset.logoutRedirect || '/';
        });
    });
});


// Task 13: authenticated REST requests for chat history and notifications.
async function task13ApiRequest(path, options = {}) {
    const token = sessionStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${TASK9_API_ROOT}${path}`, {
        method: options.method || 'GET', headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
}
