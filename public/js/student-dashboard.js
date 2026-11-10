const GRADIENTS = [
    { id: 'g1', from: '#22c55e', to: '#16a34a' },
    { id: 'g2', from: '#f59e0b', to: '#f97316' },
    { id: 'g3', from: '#06b6d4', to: '#3b82f6' },
    { id: 'g4', from: '#a855f7', to: '#7c3aed' },
    { id: 'g5', from: '#f472b6', to: '#ec4899' },
    { id: 'g6', from: '#4f46e5', to: '#4338ca' }
];

function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

function statusBadgeClass(status) {
    if (status === 'Completed') return 'badge-soft-success';
    if (status === 'Active') return 'badge-soft-info';
    return 'badge-soft-warning';
}

function courseCard(course, index) {
    const grad = GRADIENTS[index % GRADIENTS.length];
    const pct = Math.round(course.progress);
    const courseUrl = `/course-player?course=${encodeURIComponent(course.course)}`;
    const actionLabel = pct >= 100 ? 'Review Course' : (pct > 0 ? 'Continue' : 'Start Course');

    return `
    <div class="col-lg-6" data-course-card="${encodeURIComponent(course.course)}">
      <div class="course-progress-card d-flex align-items-center gap-4 flex-wrap">
        <div class="progress-ring-wrap">
          <svg width="86" height="86">
            <circle class="progress-ring-bg" cx="43" cy="43" r="36" stroke-width="8" fill="none"/>
            <circle class="ring-fill" cx="43" cy="43" r="36" stroke-width="8" fill="none"
                    stroke="url(#${grad.id})" stroke-linecap="round"
                    stroke-dasharray="${course.circumference}" stroke-dashoffset="${course.dashoffset}"
                    style="transition:stroke-dashoffset .6s ease"/>
            <defs>
              <linearGradient id="${grad.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${grad.from}"/>
                <stop offset="100%" stop-color="${grad.to}"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="progress-ring-val ring-val">${pct}%</div>
        </div>
        <div class="flex-grow-1">
          <span class="badge-soft ${statusBadgeClass(course.status)} mb-1">${course.status}</span>
          <h6 class="mb-1">${course.course}</h6>
          <small class="text-muted">${course.modulesDone} / ${course.modulesTotal} Modules
            ${pct >= 100 ? '· Certificate Earned' : ''}</small>
        </div>
        <a href="${courseUrl}" class="btn btn-outline-brand btn-sm">${actionLabel} <i class="bi bi-arrow-right"></i></a>
      </div>
    </div>`;
}

function certificateItem(course) {
    return `
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 mb-2" style="background:var(--surface-alt); border-radius:12px;">
      <div class="d-flex align-items-center gap-3">
        <i class="bi bi-patch-check-fill fs-2 text-success"></i>
        <div>
          <div class="fw-600">${course.course}</div>
          <small class="text-muted">Issued on completion · Verified</small>
        </div>
      </div>
      <button class="btn btn-outline-brand btn-sm view-cert-btn" data-course="${encodeURIComponent(course.course)}">View Certificate</button>
    </div>`;
}

function openCertModal(courseName, studentName) {
    document.getElementById('modalGreeting').textContent = `Congratulations, ${studentName.split(' ')[0]}!`;
    document.getElementById('modalCourseName').textContent = courseName;
    document.getElementById('certModal').classList.add('show');
}

function renderDashboard(data) {
    const { student, courses, stats, latestCertificate } = data;

    document.getElementById('welcomeName').textContent = `Welcome back, ${student.name.split(' ')[0]} 👋`;
    document.getElementById('userAvatar').textContent = initials(student.name);
    document.getElementById('userName').textContent = student.name;
    document.getElementById('userMeta').textContent = `${student.degree} · ${student.year}`;

    ['statEnrolled', 'statCompleted', 'statInProgress', 'statCertificates'].forEach(id => {
        document.getElementById(id).classList.remove('skeleton');
    });
    document.getElementById('statEnrolled').textContent = stats.enrolled;
    document.getElementById('statCompleted').textContent = stats.completed;
    document.getElementById('statInProgress').textContent = stats.inProgress;
    document.getElementById('statCertificates').textContent = stats.certificates;

    const grid = document.getElementById('progress');
    grid.querySelectorAll('[data-course-card]').forEach(el => el.remove());
    const emptyState = document.getElementById('coursesEmptyState');

    if (!courses.length) {
        emptyState.style.display = '';
    } else {
        emptyState.style.display = 'none';
        courses.forEach((c, i) => grid.insertAdjacentHTML('beforeend', courseCard(c, i)));
    }

    const completedCourses = courses.filter(c => c.progress >= 100);
    const certList = document.getElementById('certificatesList');
    if (completedCourses.length) {
        certList.innerHTML = completedCourses.map(certificateItem).join('');
    } else {
        certList.innerHTML = `<p class="text-muted mb-0">No certificates earned yet — keep learning!</p>`;
    }

    const banner = document.getElementById('completionBanner');
    if (latestCertificate) {
        document.getElementById('completionCourseName').textContent = latestCertificate.course;
        banner.classList.remove('d-none');
        banner.classList.add('d-flex');
    } else {
        banner.classList.add('d-none');
    }

    wireCourseButtons(student.name);
}

function wireCourseButtons(studentName) {
    document.querySelectorAll('.view-cert-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openCertModal(decodeURIComponent(btn.dataset.course), studentName);
        });
    });

    const viewCertBtn = document.getElementById('viewCertBtn');
    if (viewCertBtn) {
        viewCertBtn.addEventListener('click', () => {
            const courseName = document.getElementById('completionCourseName').textContent;
            openCertModal(courseName, studentName);
        });
    }
}


function escapeCatalogText(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
}

async function loadCourseCatalog() {
    const grid = document.getElementById('courseCatalogGrid');
    const count = document.getElementById('catalogCount');
    if (!grid) return;
    try {
        const result = await studentCourseApi.catalog();
        const courses = result.courses || [];
        count.textContent = `${courses.filter(c => !c.enrolled).length} available`;
        if (!courses.length) {
            grid.innerHTML = '<div class="col-12 text-muted">No courses are available right now.</div>';
            return;
        }
        grid.innerHTML = courses.map(course => `
            <div class="col-md-6 col-xl-4">
              <div class="h-100 p-3 border rounded-4 d-flex flex-column" style="border-color:var(--border-color,#e5e7eb)!important;background:var(--surface, #fff)">
                <div class="d-flex align-items-start gap-3 mb-3">
                  <div class="icon-tile flex-shrink-0" style="width:44px;height:44px"><i class="bi bi-journal-code"></i></div>
                  <div><h6 class="fw-bold mb-1">${escapeCatalogText(course.name)}</h6><small class="text-muted">Self-paced learning</small></div>
                </div>
                <div class="mt-auto">
                  ${course.enrolled
                    ? '<button class="btn btn-light btn-sm w-100" type="button" disabled><i class="bi bi-check-circle me-1"></i>Already Enrolled</button>'
                    : `<button class="btn btn-outline-brand btn-sm w-100 apply-course-btn" type="button" data-course="${escapeCatalogText(course.name)}"><i class="bi bi-plus-circle me-1"></i>Apply for this Course</button>`}
                </div>
              </div>
            </div>`).join('');
    } catch (err) {
        grid.innerHTML = `<div class="col-12 text-danger">Could not load courses: ${escapeCatalogText(err.message)}</div>`;
    }
}

async function refreshStudentDashboard() {
    const data = await apiRequest('/student/dashboard');
    renderDashboard(data);
    await loadCourseCatalog();
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('closeCertModal').addEventListener('click', () => {
        document.getElementById('certModal').classList.remove('show');
    });
    document.getElementById('certModal').addEventListener('click', (e) => {
        if (e.target.id === 'certModal') e.currentTarget.classList.remove('show');
    });

    document.getElementById('courseCatalogGrid')?.addEventListener('click', async (event) => {
        const button = event.target.closest('.apply-course-btn');
        if (!button) return;
        const courseName = button.dataset.course;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Applying…';
        try {
            const result = await studentCourseApi.apply(courseName);
            showInlineAlert(document.getElementById('courseApplyAlert'), result.message, 'success');
            showToast(result.message, 'success');
            await refreshStudentDashboard();
        } catch (err) {
            showInlineAlert(document.getElementById('courseApplyAlert'), err.message, 'error');
            await loadCourseCatalog();
        }
    });

    try {
        await refreshStudentDashboard();
    } catch (err) {
        if (err.status === 401) {
            window.location.href = '/login';
        } else {
            showToast('Could not load dashboard: ' + err.message, 'error');
        }
    }
});
