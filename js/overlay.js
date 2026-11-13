// Overlay Logic & Animation Engine
let state = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
let channel;

// Khởi tạo Overlay
function initOverlay() {
  // 1. Kết nối Realtime SSE với Server (Hoạt động hoàn hảo trong OBS CEF và Trình duyệt)
  try {
    const sse = new EventSource('/api/events');
    sse.onmessage = (event) => {
      try {
        const serverState = JSON.parse(event.data);
        state = Object.assign({}, DEFAULT_CONFIG, serverState);
        applyState();
      } catch (e) {
        console.error('Lỗi parse SSE:', e);
      }
    };
    sse.onerror = () => {
      // Tự động kết nối lại ngầm
    };
  } catch (e) {
    console.warn('Không hỗ trợ EventSource, dùng fallback');
  }

  // 2. Load state từ localStorage (Fallback khi mở file://)
  const saved = localStorage.getItem(HUD_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = Object.assign({}, DEFAULT_CONFIG, parsed);
    } catch (e) {
      console.warn("Lỗi đọc storage", e);
    }
  }

  // 3. Khởi tạo BroadcastChannel (Fallback cục bộ giữa các tab)
  try {
    channel = new BroadcastChannel(HUD_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        state = event.data.state;
        applyState();
      }
    };
    channel.postMessage({ type: 'STATE_REQUEST' });
  } catch (e) {
    console.error("BroadcastChannel lỗi", e);
  }

  // Khởi động hoạt ảnh động trên 2 cột viền
  initPillarEffects();

  // Áp dụng cấu hình ban đầu
  applyState();
}

// Chuyển đổi ID hoặc Link VDO.Ninja thành link chuẩn nhúng OBS
function formatVdoUrl(input) {
  if (!input || input.trim() === '') return '';
  input = input.trim();
  // Nếu người dùng chỉ nhập Stream ID (ví dụ: mycam1)
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return `https://vdo.ninja/?view=${encodeURIComponent(input)}&cleanoutput&transparent=1&autoplay=1&autostart=1`;
  }
  // Bổ sung các cờ tối ưu cho OBS Browser Source
  const urlObj = new URL(input);
  if (!urlObj.searchParams.has('cleanoutput')) urlObj.searchParams.set('cleanoutput', '');
  if (!urlObj.searchParams.has('transparent')) urlObj.searchParams.set('transparent', '1');
  if (!urlObj.searchParams.has('autoplay')) urlObj.searchParams.set('autoplay', '1');
  if (!urlObj.searchParams.has('autostart')) urlObj.searchParams.set('autostart', '1');
  if (!urlObj.searchParams.has('cover')) urlObj.searchParams.set('cover', '1');
  return urlObj.toString();
}

// Cập nhật DOM theo state
function applyState() {
  // 1. Áp dụng Tọa độ tinh chỉnh vào CSS Variables
  if (state.positions) {
    const root = document.documentElement;
    const pWidth = parseInt(state.positions.pillarWidth, 10) || 0;
    root.style.setProperty('--pillar-w', `${pWidth}px`);
    root.style.setProperty('--cam1-top', `${state.positions.cam1.top}px`);
    root.style.setProperty('--cam1-left', `${state.positions.cam1.left}px`);
    root.style.setProperty('--cam1-w', `${state.positions.cam1.width}px`);
    root.style.setProperty('--cam1-h', `${state.positions.cam1.height}px`);

    root.style.setProperty('--cam2-top', `${state.positions.cam2.top}px`);
    root.style.setProperty('--cam2-left', `${state.positions.cam2.left}px`);
    root.style.setProperty('--cam2-w', `${state.positions.cam2.width}px`);
    root.style.setProperty('--cam2-h', `${state.positions.cam2.height}px`);

    // Tự động ẩn hoàn toàn 2 cột viền nếu độ rộng <= 0 để không che game 16:9
    document.querySelectorAll('.pillar').forEach(p => {
      if (pWidth <= 0) {
        p.classList.add('pillar-hidden');
      } else {
        p.classList.remove('pillar-hidden');
      }
    });
  }

  // 2. Chuyển đổi Scene Class trên Body thông minh (chỉ trigger animation khi đổi scene thật)
  const targetSceneClass = `scene-${state.currentScene}`;
  const targetWinnerClass = state.currentScene === 'winner' ? `winner-${state.winnerTarget}` : '';

  if (!document.body.classList.contains(targetSceneClass)) {
    ['scene-versus', 'scene-ingame', 'scene-winner', 'scene-hidden', 'winner-p1', 'winner-p2'].forEach(cls => {
      document.body.classList.remove(cls);
    });
    document.body.classList.add(targetSceneClass);
    if (targetWinnerClass) document.body.classList.add(targetWinnerClass);
  } else if (state.currentScene === 'winner' && !document.body.classList.contains(targetWinnerClass)) {
    document.body.classList.remove('winner-p1', 'winner-p2');
    document.body.classList.add(targetWinnerClass);
  }

  // 3. Thông tin Header & Match
  document.getElementById('versusTournamentTitle').innerText = state.tournamentName || 'BLEACH VS NARUTO';
  document.getElementById('versusMatchPhase').innerText = state.matchPhase || 'TOURNAMENT';
  document.getElementById('leftPillarMatchInfo').innerText = state.matchPhase || 'BO3 MATCH';
  document.getElementById('rightPillarMatchInfo').innerText = state.tournamentName || 'BvN 2026';

  // 4. Thông tin Player 1
  document.getElementById('p1NameVs').innerText = state.p1.name || 'PLAYER 1';
  document.getElementById('p1TeamVs').innerText = state.p1.team || 'BLEACH';
  document.getElementById('p1ScoreVs').innerText = state.p1.score;
  document.getElementById('p1NameTop').innerText = state.p1.name || 'PLAYER 1';
  document.getElementById('p1ScoreTop').innerText = state.p1.score;
  document.getElementById('cam1Tag').innerText = state.p1.name || 'PLAYER 1';
  document.getElementById('p1PillarName').innerText = state.p1.name || 'PLAYER 1';

  // 5. Thông tin Player 2
  document.getElementById('p2NameVs').innerText = state.p2.name || 'PLAYER 2';
  document.getElementById('p2TeamVs').innerText = state.p2.team || 'NARUTO';
  document.getElementById('p2ScoreVs').innerText = state.p2.score;
  document.getElementById('p2NameTop').innerText = state.p2.name || 'PLAYER 2';
  document.getElementById('p2ScoreTop').innerText = state.p2.score;
  document.getElementById('cam2Tag').innerText = state.p2.name || 'PLAYER 2';
  document.getElementById('p2PillarName').innerText = state.p2.name || 'PLAYER 2';

  // 6. Thông tin Màn Winner
  const winnerPlayer = state.winnerTarget === 'p1' ? state.p1 : state.p2;
  document.getElementById('winnerPlayerName').innerText = winnerPlayer.name || 'WINNER';
  document.getElementById('winnerSubText').innerText = state.winnerText || 'WINNER';

  // 7. Cập nhật Bo Score Dots trên 2 Cột
  renderPillarDots('p1PillarDots', state.p1.score, state.bo);
  renderPillarDots('p2PillarDots', state.p2.score, state.bo);

  // 8. Cập nhật Camera Sources (VDO.Ninja vs Mock)
  updateCamSources();
}

// Vẽ chấm điểm Bo trên cột viền
function renderPillarDots(elementId, score, bo) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';
  const winsNeeded = Math.ceil(bo / 2);

  for (let i = 0; i < winsNeeded; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < score ? ' won' : '');
    container.appendChild(dot);
  }
}

// Quản lý Iframe VDO.Ninja
function updateCamSources() {
  const iframe1 = document.getElementById('iframe1');
  const iframe2 = document.getElementById('iframe2');
  const mock1 = document.getElementById('mock1');
  const mock2 = document.getElementById('mock2');

  const p1Url = formatVdoUrl(state.p1.vdoUrl);
  const p2Url = formatVdoUrl(state.p2.vdoUrl);

  if (state.useTestCam || !p1Url) {
    iframe1.style.display = 'none';
    mock1.style.display = 'flex';
  } else {
    mock1.style.display = 'none';
    iframe1.style.display = 'block';
    if (iframe1.getAttribute('src') !== p1Url) {
      iframe1.setAttribute('src', p1Url);
    }
  }

  if (state.useTestCam || !p2Url) {
    iframe2.style.display = 'none';
    mock2.style.display = 'flex';
  } else {
    mock2.style.display = 'none';
    iframe2.style.display = 'block';
    if (iframe2.getAttribute('src') !== p2Url) {
      iframe2.setAttribute('src', p2Url);
    }
  }
}

// =========================================================================
// HIỆU ỨNG ĐỘNG DÀI VIỀN HÔNG (BLEACH REIATSU & NARUTO CHAKRA CANVAS ENGINE)
// =========================================================================
function initPillarEffects() {
  const canvasLeft = document.getElementById('leftAuraCanvas');
  const canvasRight = document.getElementById('rightAuraCanvas');

  if (!canvasLeft || !canvasRight) return;

  const ctxLeft = canvasLeft.getContext('2d');
  const ctxRight = canvasRight.getContext('2d');

  function resizeCanvas() {
    canvasLeft.width = canvasLeft.offsetWidth || 240;
    canvasLeft.height = window.innerHeight;
    canvasRight.width = canvasRight.offsetWidth || 240;
    canvasRight.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Khởi tạo hạt tâm linh Bleach (Xanh Cyan / Đen)
  const bleachParticles = [];
  for (let i = 0; i < 40; i++) {
    bleachParticles.push({
      x: Math.random() * canvasLeft.width,
      y: Math.random() * canvasLeft.height,
      radius: Math.random() * 2.5 + 0.5,
      speedY: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.7 + 0.2
    });
  }

  // Khởi tạo hạt Chakra Lửa Naruto (Vàng / Cam)
  const narutoParticles = [];
  for (let i = 0; i < 45; i++) {
    narutoParticles.push({
      x: Math.random() * canvasRight.width,
      y: Math.random() * canvasRight.height,
      radius: Math.random() * 3 + 1,
      speedY: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.8 + 0.2
    });
  }

  // Vòng lặp Render 60fps mượt mà
  function renderAuras() {
    // Chỉ render khi đang ở Scene Ingame để tiết kiệm CPU khi ở Versus/Winner
    if (state.currentScene === 'ingame') {
      // 1. Left Canvas - Bleach Spiritual Particles
      ctxLeft.clearRect(0, 0, canvasLeft.width, canvasLeft.height);
      for (let p of bleachParticles) {
        ctxLeft.beginPath();
        ctxLeft.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctxLeft.fillStyle = `rgba(0, 210, 255, ${p.opacity})`;
        ctxLeft.shadowColor = '#00d2ff';
        ctxLeft.shadowBlur = 8;
        ctxLeft.fill();

        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = canvasLeft.height;
          p.x = Math.random() * canvasLeft.width;
        }
      }

      // 2. Right Canvas - Naruto Flame Swirls
      ctxRight.clearRect(0, 0, canvasRight.width, canvasRight.height);
      for (let p of narutoParticles) {
        ctxRight.beginPath();
        ctxRight.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctxRight.fillStyle = `rgba(255, ${Math.floor(100 + Math.random()*80)}, 0, ${p.opacity})`;
        ctxRight.shadowColor = '#ff6a00';
        ctxRight.shadowBlur = 10;
        ctxRight.fill();

        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = canvasRight.height;
          p.x = Math.random() * canvasRight.width;
        }
      }
    }

    requestAnimationFrame(renderAuras);
  }

  requestAnimationFrame(renderAuras);
}

document.addEventListener('DOMContentLoaded', initOverlay);

