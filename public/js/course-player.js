const params = new URLSearchParams(window.location.search);
const COURSE_NAME = params.get('course');

let STATE = null; // full content + progress response
let selectedModuleId = null;
let quizAnswers = [];

function el(id) { return document.getElementById(id); }

function statusBadgeClass(status) {
    if (status === 'Completed') return 'badge-soft-success';
    if (status === 'Active') return 'badge-soft-info';
    return 'badge-soft-warning';
}

function renderModuleList() {
    const list = el('moduleList');
    list.innerHTML = '';

    STATE.modules.forEach((m, i) => {
        const done = STATE.completedModules.includes(m.id);
        const isActive = m.id === selectedModuleId;
        const item = document.createElement('div');
        item.className = `module-list-item ${done ? 'done' : ''} ${isActive ? 'active' : ''}`;
        item.innerHTML = `
            <div class="step-icon">${done ? '<i class="bi bi-check-lg"></i>' : i + 1}</div>
            <div class="flex-grow-1">
                <div class="fw-600 small">${m.title}</div>
                <small class="text-muted">${m.type === 'video' ? 'Video lesson' : 'Reading'}</small>
            </div>`;
        item.addEventListener('click', () => selectModule(m.id));
        list.appendChild(item);
    });

    const allDone = STATE.completedModules.length >= STATE.modules.length;
    el('quizLauncher').style.display = allDone ? '' : 'none';
    if (STATE.quizPassed) {
        el('quizStatusText').textContent = `Passed with ${STATE.quizScore}/${STATE.quiz.questions.length} correct. Certificate earned! 🎉`;
        el('startQuizBtn').textContent = 'Review / Retake Quiz';
    } else if (STATE.quizAttempts > 0) {
        el('quizStatusText').textContent = `Last attempt: ${STATE.quizScore} correct — try again to pass.`;
        el('startQuizBtn').textContent = 'Retake Quiz';
    }
}

function selectModule(moduleId) {
    selectedModuleId = moduleId;
    const m = STATE.modules.find(x => x.id === moduleId);
    if (!m) return;

    el('moduleViewer').style.display = '';
    el('quizViewer').style.display = 'none';
    el('quizResult').style.display = 'none';

    el('moduleTypeBadge').textContent = m.type === 'video' ? 'Video Lesson' : 'Reading';
    el('moduleTitle').textContent = m.title;
    el('moduleContent').textContent = m.content;

    if (m.type === 'video') {
        el('moduleVideoWrap').style.display = '';
        const video = el('moduleVideo');
        if (video.getAttribute('src') !== m.videoUrl) {
            video.setAttribute('src', m.videoUrl);
        }
    } else {
        el('moduleVideoWrap').style.display = 'none';
    }

    const alreadyDone = STATE.completedModules.includes(moduleId);
    const btn = el('markCompleteBtn');
    if (alreadyDone) {
        btn.innerHTML = `<i class="bi bi-check-circle me-1"></i>Completed`;
        btn.classList.remove('btn-gradient-accent');
        btn.classList.add('btn-outline-brand');
        btn.disabled = true;
    } else {
        btn.innerHTML = `Mark Complete & Continue <i class="bi bi-arrow-right ms-1"></i>`;
        btn.classList.add('btn-gradient-accent');
        btn.classList.remove('btn-outline-brand');
        btn.disabled = false;
    }

    renderModuleList();
}

async function markComplete() {
    const btn = el('markCompleteBtn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
    try {
        const data = await apiRequest(
            `/student/courses/${encodeURIComponent(COURSE_NAME)}/modules/${selectedModuleId}/complete`,
            { method: 'POST' }
        );
        STATE.completedModules = data.completedModules;
        updateProgressUI(data.progress, data.status);
        showToast('Module marked complete!', 'success');

        // Auto-advance to the next incomplete module, if any
        const currentIndex = STATE.modules.findIndex(m => m.id === selectedModuleId);
        const next = STATE.modules[currentIndex + 1];
        if (next) {
            selectModule(next.id);
        } else {
            selectModule(selectedModuleId); // refresh button state
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = `Mark Complete & Continue <i class="bi bi-arrow-right ms-1"></i>`;
    }
}

function updateProgressUI(progress, status) {
    el('courseProgressPct').textContent = `${progress}%`;
    el('courseProgressBar').style.width = `${progress}%`;
    const badge = el('courseStatusBadge');
    badge.textContent = status;
    badge.className = `badge-soft ${statusBadgeClass(status)}`;
}

function renderQuiz() {
    el('moduleViewer').style.display = 'none';
    el('quizResult').style.display = 'none';
    el('quizViewer').style.display = '';

    quizAnswers = new Array(STATE.quiz.questions.length).fill(null);

    const container = el('quizQuestions');
    container.innerHTML = STATE.quiz.questions.map((q, qi) => `
        <div class="mb-4">
          <div class="fw-600 mb-2">${qi + 1}. ${q.question}</div>
          ${q.options.map((opt, oi) => `
            <label class="quiz-option" data-q="${qi}" data-o="${oi}">
              <input type="radio" name="q${qi}" value="${oi}"> ${opt}
            </label>
          `).join('')}
        </div>
    `).join('');

    container.querySelectorAll('input[type=radio]').forEach(input => {
        input.addEventListener('change', (e) => {
            const label = e.target.closest('.quiz-option');
            const qi = Number(label.dataset.q);
            const oi = Number(label.dataset.o);
            quizAnswers[qi] = oi;

            container.querySelectorAll(`.quiz-option[data-q="${qi}"]`).forEach(l => l.classList.remove('selected'));
            label.classList.add('selected');
        });
    });
}

async function submitQuiz() {
    if (quizAnswers.some(a => a === null)) {
        showToast('Please answer every question.', 'error');
        return;
    }

    const btn = el('submitQuizBtn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Submitting...`;

    try {
        const data = await apiRequest(`/student/courses/${encodeURIComponent(COURSE_NAME)}/quiz/submit`, {
            method: 'POST',
            body: { answers: quizAnswers }
        });

        STATE.quizPassed = data.passed;
        STATE.quizScore = data.correctCount;
        updateProgressUI(data.progress, data.status);

        el('quizViewer').style.display = 'none';
        el('quizResult').style.display = '';

        if (data.passed) {
            el('resultIcon').style.background = 'var(--gradient-accent)';
            el('resultIcon').innerHTML = `<i class="bi bi-award-fill"></i>`;
            el('resultTitle').textContent = 'Congratulations — you passed!';
            el('resultSubtitle').textContent =
                `You scored ${data.correctCount}/${data.total}. Your certificate for ${COURSE_NAME} is ready.`;
            el('resultActions').innerHTML = `
                <a href="/student-dashboard" class="btn btn-gradient-primary">
                    <i class="bi bi-speedometer2 me-1"></i> Back to Dashboard
                </a>`;
            showToast('🎉 Course completed! Certificate earned.', 'success');
        } else {
            el('resultIcon').style.background = 'linear-gradient(135deg,#f59e0b,#f97316)';
            el('resultIcon').innerHTML = `<i class="bi bi-arrow-repeat"></i>`;
            el('resultTitle').textContent = 'Not quite — try again';
            el('resultSubtitle').textContent =
                `You scored ${data.correctCount}/${data.total}. Review the modules and retake the quiz whenever you're ready.`;
            el('resultActions').innerHTML = `
                <button class="btn btn-gradient-primary me-2" id="retakeQuizBtn">
                    <i class="bi bi-arrow-repeat me-1"></i> Retake Quiz
                </button>
                <a href="/student-dashboard" class="btn btn-outline-brand">Back to Dashboard</a>`;
            el('retakeQuizBtn').addEventListener('click', renderQuiz);
        }

        renderModuleList();
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Submit Quiz';
    }
}

async function init() {
    if (!COURSE_NAME) {
        showToast('No course specified.', 'error');
        window.location.href = '/student-dashboard';
        return;
    }

    try {
        STATE = await apiRequest(`/courses/${encodeURIComponent(COURSE_NAME)}/content`);
    } catch (err) {
        if (err.status === 401) {
            window.location.href = '/login';
        } else {
            showToast(err.message, 'error');
            window.location.href = '/student-dashboard';
        }
        return;
    }

    document.title = `${COURSE_NAME} — LearnSphere`;
    el('navCourseTitle').textContent = COURSE_NAME;
    el('courseTitle').textContent = COURSE_NAME;
    updateProgressUI(STATE.progress, STATE.status);

    // Start on the first incomplete module, or the first module if all are done
    const firstIncomplete = STATE.modules.find(m => !STATE.completedModules.includes(m.id));
    selectModule(firstIncomplete ? firstIncomplete.id : STATE.modules[0].id);

    el('markCompleteBtn').addEventListener('click', markComplete);
    el('startQuizBtn').addEventListener('click', renderQuiz);
    el('submitQuizBtn').addEventListener('click', submitQuiz);
}

document.addEventListener('DOMContentLoaded', init);
