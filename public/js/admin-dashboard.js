function statusBadgeClass(status) {
    if (status === 'Completed') return 'badge-soft-success';
    if (status === 'Active') return 'badge-soft-info';
    return 'badge-soft-warning';
}

function progressColor(pct) {
    if (pct >= 100) return 'var(--success)';
    if (pct >= 50) return 'var(--gradient-info)';
    return 'var(--gradient-accent)';
}

function courseStatsRow(c) {
    return `
    <tr>
      <td class="fw-600">${escapeHtml(c.course)}</td>
      <td>${c.enrolled}</td>
      <td>${c.completed}</td>
      <td>
        <span class="mini-progress"><span style="width:${c.avgProgress}%;background:${progressColor(c.avgProgress)}"></span></span>
        <small class="text-muted ms-2">${c.avgProgress}%</small>
      </td>
    </tr>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getPrimaryCourse(student) {
    const courses = Array.isArray(student.courses) ? student.courses : [];
    return courses[0] || {
        course: 'No course',
        progress: 0,
        status: 'Not Started'
    };
}

function registrationRow(student) {
    const course = getPrimaryCourse(student);
    const initials = String(student.name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join('');

    return `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="av" style="width:34px;height:34px;font-size:12px;background:var(--gradient-primary)">${escapeHtml(initials)}</div>
          <div>
            <div class="fw-600">${escapeHtml(student.name)}</div>
            <small class="text-muted">${escapeHtml(student.email)}</small>
          </div>
        </div>
      </td>
      <td>${escapeHtml(student.degree)} · ${escapeHtml(student.year)}</td>
      <td>${escapeHtml(course.course)}</td>
      <td>
        <span class="mini-progress"><span style="width:${course.progress}%;background:${progressColor(course.progress)}"></span></span>
        <small class="text-muted ms-2">${course.progress}%</small>
      </td>
      <td><span class="badge-soft ${statusBadgeClass(course.status)}">${escapeHtml(course.status)}</span></td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-outline-brand btn-sm edit-student-btn" data-id="${escapeHtml(student.id)}" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm delete-student-btn" data-id="${escapeHtml(student.id)}" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
}

function renderOverview(data) {
    const { stats, courseStats } = data;

    ['mTotalStudents', 'mTotalCourses', 'mTotalEnrollments', 'mCertificates'].forEach(id => {
        document.getElementById(id).classList.remove('skeleton');
    });
    document.getElementById('mTotalStudents').textContent = stats.totalStudents;
    document.getElementById('mTotalCourses').textContent = stats.totalCourses;
    document.getElementById('mTotalEnrollments').textContent = stats.totalEnrollments;
    document.getElementById('mCertificates').textContent = stats.certificatesIssued;

    const courseBody = document.getElementById('courseStatsBody');
    courseBody.innerHTML = courseStats.length
        ? courseStats.map(courseStatsRow).join('')
        : `<tr><td colspan="4" class="text-center text-muted py-4">No enrollments yet.</td></tr>`;

    const completionRate = stats.totalEnrollments
        ? Math.round((stats.certificatesIssued / stats.totalEnrollments) * 100)
        : 0;
    document.getElementById('reportCompletionBar').style.width = completionRate + '%';
    document.getElementById('reportCompletionLabel').textContent =
        `${completionRate}% of enrollments completed (${stats.certificatesIssued} / ${stats.totalEnrollments})`;
}

async function loadOverview() {
    const data = await apiRequest('/admin/overview');
    renderOverview(data);
}

async function loadStudents() {
    const body = document.getElementById('registrationsBody');
    const badge = document.getElementById('totalRegBadge');
    const errorBox = document.getElementById('studentApiError');

    errorBox.className = 'alert-inline error mb-3';
    errorBox.textContent = '';
    body.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>Loading students...
    </td></tr>`;

    try {
        const students = await studentApi.list();
        badge.textContent = `${students.length} total`;

        if (!students.length) {
            body.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">
                No student records found. Use Add Student to create one.
            </td></tr>`;
            return;
        }

        body.innerHTML = students.map(registrationRow).join('');
        wireStudentActions();
    } catch (err) {
        body.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Unable to load students.</td></tr>`;
        errorBox.textContent = err.message || 'Failed to load students.';
        errorBox.classList.add('show');
    }
}

async function loadCourses() {
    const select = document.getElementById('studentCourse');
    try {
        const courses = await courseApi.list();
        select.innerHTML = '<option value="">Choose Course</option>' +
            courses.map(course => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`).join('');
    } catch (err) {
        select.innerHTML = '<option value="">Unable to load courses</option>';
        throw err;
    }
}

function openStudentModal(student = null) {
    const modal = document.getElementById('studentModal');
    const form = document.getElementById('studentForm');
    const alertBox = document.getElementById('studentFormAlert');

    hideInlineAlert(alertBox);
    form.reset();

    document.getElementById('studentId').value = student ? student.id : '';
    document.getElementById('studentModalTitle').textContent = student ? 'Edit Student' : 'Add Student';
    document.getElementById('saveStudentBtn').textContent = student ? 'Update Student' : 'Save Student';

    document.getElementById('studentName').value = student?.name || '';
    document.getElementById('studentEmail').value = student?.email || '';
    document.getElementById('studentDegree').value = student?.degree || '';
    document.getElementById('studentYear').value = student?.year || '';

    const course = getPrimaryCourse(student || {}).course;
    document.getElementById('studentCourse').value = course || '';

    const password = document.getElementById('studentPassword');
    password.value = '';
    password.required = !student;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

async function editStudent(id) {
    try {
        const student = await studentApi.get(id);
        openStudentModal(student);
    } catch (err) {
        showToast('Could not load student: ' + err.message, 'error');
    }
}

async function deleteStudent(id) {
    const confirmed = window.confirm('Delete this student record? This cannot be undone.');
    if (!confirmed) return;

    try {
        await studentApi.remove(id);
        showToast('Student deleted successfully.', 'success');
        await Promise.all([loadStudents(), loadOverview()]);
    } catch (err) {
        showToast('Could not delete student: ' + err.message, 'error');
    }
}

function wireStudentActions() {
    document.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', () => editStudent(btn.dataset.id));
    });

    document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
    });
}

async function saveStudent(e) {
    e.preventDefault();

    const alertBox = document.getElementById('studentFormAlert');
    const submitBtn = document.getElementById('saveStudentBtn');
    hideInlineAlert(alertBox);

    const id = document.getElementById('studentId').value;
    const body = {
        name: document.getElementById('studentName').value.trim(),
        email: document.getElementById('studentEmail').value.trim(),
        degree: document.getElementById('studentDegree').value.trim(),
        year: document.getElementById('studentYear').value,
        course: document.getElementById('studentCourse').value,
        password: document.getElementById('studentPassword').value
    };

    if (!body.name || !body.email || !body.degree || !body.year || !body.course) {
        showInlineAlert(alertBox, 'Please fill all required fields.', 'error');
        return;
    }
    if (!id && body.password.length < 6) {
        showInlineAlert(alertBox, 'Password must be at least 6 characters.', 'error');
        return;
    }

    setButtonLoading(submitBtn, true, id ? 'Updating...' : 'Saving...');

    try {
        if (id) {
            await studentApi.update(id, body);
        } else {
            await studentApi.create(body);
        }
        closeStudentModal();
        showToast(id ? 'Student updated successfully.' : 'Student added successfully.', 'success');
        await Promise.all([loadStudents(), loadOverview()]);
    } catch (err) {
        showInlineAlert(alertBox, err.message || 'Failed to save student.', 'error');
    } finally {
        setButtonLoading(submitBtn, false, id ? 'Update Student' : 'Save Student');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('studentForm').addEventListener('submit', saveStudent);

    document.getElementById('addStudentBtn').addEventListener('click', () => openStudentModal());

    document.getElementById('closeStudentModal').addEventListener('click', closeStudentModal);
    document.getElementById('cancelStudentBtn').addEventListener('click', closeStudentModal);
    document.getElementById('studentModal').addEventListener('click', (e) => {
        if (e.target.id === 'studentModal') closeStudentModal();
    });

    try {
        const me = await apiRequest('/me');
        document.getElementById('adminName').textContent = me.name;
        document.getElementById('adminAvatar').textContent = me.name.slice(0, 2).toUpperCase();

        await loadCourses();
        await Promise.all([loadOverview(), loadStudents()]);
    } catch (err) {
        if (err.status === 401) {
            window.location.href = '/admin-login';
        } else {
            showToast('Could not load admin data: ' + err.message, 'error');
        }
    }
});
