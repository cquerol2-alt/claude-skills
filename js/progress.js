/* ============================================
   SISTEMA DE PROGRESO — Curso IA Juan Querol
   XP, Badges, Streak, Tests
   ============================================ */

const CourseProgress = (() => {
  // --- Configuración ---
  const STORAGE_KEY = 'curso-ia-juan-progress';
  const XP_PER_CLASS = 10;
  const XP_BONUS_HIGH_SCORE = 5;  // si test >= 9/10
  const XP_PER_BOSS_BATTLE = 50;
  const XP_PER_RETO = 20;
  const PASS_THRESHOLD = 7; // nota mínima para aprobar test (de 10)

  const BADGES = {
    'python-initiate': { name: 'Python Initiate', icon: '🐍', module: 1, description: 'Completa el Módulo 1: Python para Devs Web' },
    'api-master': { name: 'API Master', icon: '🔌', module: 3, description: 'Completa el Módulo 3: APIs de IA' },
    'ai-augmented': { name: 'AI-Augmented Dev', icon: '🤖', module: 4, description: 'Completa el Módulo 4: AI Coding Tools' },
    'rag-wizard': { name: 'RAG Wizard', icon: '🧙', module: 5, description: 'Completa el Módulo 5: RAG' },
    'agent-builder': { name: 'Agent Builder', icon: '🏗️', module: 6, description: 'Completa el Módulo 6: Agentes de IA' },
    'fullstack-ai': { name: 'Full-Stack AI Dev', icon: '🚀', module: 7, description: 'Completa el Módulo 7: Full-Stack AI App' },
    'portfolio-pro': { name: 'Portfolio Pro', icon: '💼', module: 8, description: 'Completa el Módulo 8: Portfolio y CV' },
    'first-blood': { name: 'First Blood', icon: '🩸', module: null, description: 'Completa tu primera clase' },
    'streak-7': { name: 'En Racha ×7', icon: '🔥', module: null, description: '7 días consecutivos estudiando' },
    'perfect-score': { name: 'Nota Perfecta', icon: '💯', module: null, description: 'Saca 10/10 en un test' },
  };

  const MODULES = {
    1: { name: 'Python para Devs Web', totalClasses: 10, weeks: '1-2' },
    2: { name: 'Fundamentos de IA y LLMs', totalClasses: 5, weeks: '3' },
    3: { name: 'APIs de IA — Tu Primer Chatbot', totalClasses: 5, weeks: '4' },
    4: { name: 'AI Coding Tools', totalClasses: 5, weeks: '5' },
    5: { name: 'RAG — IA con Tus Datos', totalClasses: 10, weeks: '6-7' },
    6: { name: 'Agentes de IA', totalClasses: 5, weeks: '8' },
    7: { name: 'Full-Stack AI App', totalClasses: 5, weeks: '9' },
    8: { name: 'Portfolio, CV y Job-Ready', totalClasses: 5, weeks: '10' },
  };

  // --- Estado por defecto ---
  function getDefaultState() {
    return {
      xp: 0,
      badges: [],
      completedClasses: [],   // ["m1-c01", "m1-c02", ...]
      testScores: {},          // {"m1-c01": 8, "m1-c02": 10, ...}
      streak: 0,
      lastStudyDate: null,
      startDate: null,
    };
  }

  // --- Persistencia ---
  function load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return { ...getDefaultState(), ...JSON.parse(data) };
    } catch (e) {
      console.warn('Error cargando progreso:', e);
    }
    return getDefaultState();
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Error guardando progreso:', e);
    }
  }

  // --- Streak ---
  function updateStreak(state) {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastStudyDate === today) return state;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (state.lastStudyDate === yesterday) {
      state.streak += 1;
    } else if (state.lastStudyDate !== today) {
      state.streak = 1;
    }
    state.lastStudyDate = today;
    if (!state.startDate) state.startDate = today;

    // Badge racha
    if (state.streak >= 7 && !state.badges.includes('streak-7')) {
      state.badges.push('streak-7');
    }
    return state;
  }

  // --- Completar clase ---
  function completeClass(classId, testScore = null) {
    let state = load();
    state = updateStreak(state);

    if (!state.completedClasses.includes(classId)) {
      state.completedClasses.push(classId);

      // XP por clase
      const isBossBattle = classId.endsWith('-bb');
      state.xp += isBossBattle ? XP_PER_BOSS_BATTLE : XP_PER_CLASS;

      // First blood
      if (state.completedClasses.length === 1 && !state.badges.includes('first-blood')) {
        state.badges.push('first-blood');
      }
    }

    // Test score
    if (testScore !== null) {
      state.testScores[classId] = testScore;
      if (testScore >= 9) state.xp += XP_BONUS_HIGH_SCORE;
      if (testScore === 10 && !state.badges.includes('perfect-score')) {
        state.badges.push('perfect-score');
      }
    }

    // Check module completion for badges
    checkModuleBadges(state);

    save(state);
    return state;
  }

  function checkModuleBadges(state) {
    const moduleBadgeMap = {
      1: 'python-initiate',
      3: 'api-master',
      4: 'ai-augmented',
      5: 'rag-wizard',
      6: 'agent-builder',
      7: 'fullstack-ai',
      8: 'portfolio-pro',
    };
    for (const [modNum, badgeId] of Object.entries(moduleBadgeMap)) {
      const mod = MODULES[modNum];
      if (!mod) continue;
      const prefix = `m${modNum}-`;
      const completed = state.completedClasses.filter(c => c.startsWith(prefix)).length;
      if (completed >= mod.totalClasses && !state.badges.includes(badgeId)) {
        state.badges.push(badgeId);
      }
    }
  }

  // --- Getters ---
  function getState() { return load(); }

  function getModuleProgress(moduleNum) {
    const state = load();
    const prefix = `m${moduleNum}-`;
    const completed = state.completedClasses.filter(c => c.startsWith(prefix)).length;
    const total = MODULES[moduleNum]?.totalClasses || 0;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }

  function getTotalProgress() {
    const state = load();
    const totalClasses = Object.values(MODULES).reduce((sum, m) => sum + m.totalClasses, 0);
    const completed = state.completedClasses.length;
    return { completed, total: totalClasses, percent: totalClasses > 0 ? Math.round((completed / totalClasses) * 100) : 0 };
  }

  function isClassCompleted(classId) {
    return load().completedClasses.includes(classId);
  }

  function getTestScore(classId) {
    return load().testScores[classId] ?? null;
  }

  // --- Quiz Engine ---
  function initQuiz(containerId, questions, classId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    questions.forEach((q, i) => {
      html += `<div class="quiz-question" data-question="${i}" data-correct="${q.correct}">
        <p>${i + 1}. ${q.question}</p>`;
      q.options.forEach((opt, j) => {
        html += `<label>
          <input type="radio" name="q${i}" value="${j}"> ${opt}
        </label>`;
      });
      html += `</div>`;
    });

    html += `<div style="text-align:center; margin-top:1.5em;">
      <button class="btn btn-green" onclick="CourseProgress.submitQuiz('${containerId}', '${classId}')">
        Comprobar respuestas
      </button>
    </div>`;

    html += `<div id="${containerId}-score" class="score-display"></div>`;
    container.innerHTML = html;
  }

  function submitQuiz(containerId, classId) {
    const container = document.getElementById(containerId);
    const questionEls = container.querySelectorAll('.quiz-question');
    let correct = 0;
    const total = questionEls.length;

    questionEls.forEach(qEl => {
      const correctAnswer = parseInt(qEl.dataset.correct);
      const selected = qEl.querySelector('input:checked');
      const labels = qEl.querySelectorAll('label');

      // Reset
      labels.forEach(l => l.classList.remove('correct', 'incorrect'));

      if (selected) {
        const selectedVal = parseInt(selected.value);
        if (selectedVal === correctAnswer) {
          correct++;
          labels[selectedVal].classList.add('correct');
        } else {
          labels[selectedVal].classList.add('incorrect');
          labels[correctAnswer].classList.add('correct');
        }
      } else {
        labels[correctAnswer].classList.add('correct');
      }

      // Disable radio buttons
      qEl.querySelectorAll('input').forEach(inp => inp.disabled = true);
    });

    const score = Math.round((correct / total) * 10);
    const passed = score >= PASS_THRESHOLD;

    const scoreEl = document.getElementById(`${containerId}-score`);
    scoreEl.className = `score-display show ${passed ? 'score-pass' : 'score-fail'}`;
    scoreEl.innerHTML = `
      <div class="score-number">${score}/10</div>
      <p style="margin-top:0.5em; font-size:1.1em;">
        ${passed
          ? '¡Aprobado! 🎉 +' + XP_PER_CLASS + ' XP' + (score >= 9 ? ' +' + XP_BONUS_HIGH_SCORE + ' XP bonus' : '')
          : 'No has llegado al 7/10. ¡Repasa e inténtalo de nuevo!'}
      </p>
      ${passed ? '' : '<button class="btn" style="margin-top:1em;" onclick="location.reload()">Reintentar</button>'}
    `;

    if (passed) {
      const state = completeClass(classId, score);
      // Disable submit button
      container.querySelector('.btn-green').disabled = true;
      container.querySelector('.btn-green').style.opacity = '0.5';
    }
  }

  // --- Render helpers ---
  function renderXPBar(containerId, currentXP, maxXP) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const percent = Math.min(100, Math.round((currentXP / maxXP) * 100));
    el.innerHTML = `
      <div class="xp-bar-container">
        <div class="xp-bar" style="width:${percent}%"></div>
        <span class="xp-label">${currentXP} / ${maxXP} XP</span>
      </div>`;
  }

  function renderBadges(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const state = load();
    let html = '';
    for (const [id, badge] of Object.entries(BADGES)) {
      const unlocked = state.badges.includes(id);
      html += `<span class="badge ${unlocked ? 'badge-unlocked' : 'badge-locked'}" title="${badge.description}">
        ${badge.icon} ${badge.name}
      </span> `;
    }
    el.innerHTML = html;
  }

  function renderStreak(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const state = load();
    el.innerHTML = `<span class="streak">🔥 ${state.streak} día${state.streak !== 1 ? 's' : ''}</span>`;
  }

  // --- Reset (solo para debug) ---
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Progreso reseteado');
  }

  // --- API pública ---
  return {
    completeClass,
    getState,
    getModuleProgress,
    getTotalProgress,
    isClassCompleted,
    getTestScore,
    initQuiz,
    submitQuiz,
    renderXPBar,
    renderBadges,
    renderStreak,
    reset,
    BADGES,
    MODULES,
    PASS_THRESHOLD,
  };
})();
