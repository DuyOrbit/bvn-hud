// Admin Logic & Sync Controller
let state = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
let channel;

// Khởi tạo BroadcastChannel, Server Sync & Load LocalStorage
function initAdmin() {
  const saved = localStorage.getItem(HUD_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = Object.assign({}, DEFAULT_CONFIG, parsed);
    } catch (e) {
      console.warn("Lỗi load storage, dùng mặc định", e);
    }
  }

  // Lấy dữ liệu mới nhất từ server (nếu server đang chạy)
  fetch('/api/state')
    .then(res => res.json())
    .then(serverState => {
      if (serverState) {
        state = Object.assign({}, DEFAULT_CONFIG, serverState);
        localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(state));
        renderUI();
      }
    })
    .catch(() => {});

  // Kết nối BroadcastChannel (cho các tab cùng trình duyệt)
  try {
    channel = new BroadcastChannel(HUD_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_REQUEST') {
        broadcastState();
      }
    };
  } catch (e) {
    console.error("BroadcastChannel không được hỗ trợ", e);
  }

  renderUI();
}

// Lưu và Phát tín hiệu cập nhật (Đồng thời bắn lên Server để OBS nhận ngay lập tức)
function broadcastState() {
  localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(state));
  if (channel) {
    channel.postMessage({
      type: 'STATE_UPDATE',
      state: state
    });
  }

  // Gửi trực tiếp lên Server qua HTTP POST để OBS Studio nhận tức thì
  fetch('/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  }).catch(e => {
    // Nếu chạy file:// không qua server thì bỏ qua
  });
}

// Cập nhật toàn bộ Form giao diện từ `state`
function renderUI() {
  document.getElementById('tournamentName').value = state.tournamentName;
  document.getElementById('matchPhase').value = state.matchPhase;

  // Player 1
  document.getElementById('p1Name').value = state.p1.name;
  document.getElementById('p1Team').value = state.p1.team;
  document.getElementById('p1VdoUrl').value = state.p1.vdoUrl;
  document.getElementById('p1ScoreDisplay').innerText = state.p1.score;

  // Player 2
  document.getElementById('p2Name').value = state.p2.name;
  document.getElementById('p2Team').value = state.p2.team;
  document.getElementById('p2VdoUrl').value = state.p2.vdoUrl;
  document.getElementById('p2ScoreDisplay').innerText = state.p2.score;

  // Winner Quick Text
  document.getElementById('winnerTextInput').value = state.winnerText;
  document.getElementById('winnerP1Label').innerText = `WINNER ${state.p1.name || 'P1'}`;
  document.getElementById('winnerP2Label').innerText = `WINNER ${state.p2.name || 'P2'}`;

  // Bo Selector
  document.querySelectorAll('.btn-bo').forEach(btn => btn.classList.remove('active'));
  const activeBo = document.getElementById(`bo${state.bo}`);
  if (activeBo) activeBo.classList.add('active');

  // Active Scene Button
  updateActiveSceneButton();

  // Test Cam toggle
  document.getElementById('testCamToggle').checked = state.useTestCam;

  // Fine-tuning values
  if (state.positions) {
    const pw = state.positions.pillarWidth !== undefined ? state.positions.pillarWidth : 0;
    const rng1 = document.getElementById('rngPillarWidth');
    const rng2 = document.getElementById('rngPillarWidthMain');
    const lbl1 = document.getElementById('valPillarWidth');
    const lbl2 = document.getElementById('valPillarWidthMain');

    if (rng1) rng1.value = pw;
    if (rng2) rng2.value = pw;
    if (lbl1) lbl1.innerText = `${pw}px`;
    if (lbl2) lbl2.innerText = `${pw}px`;

    document.getElementById('rngCam1Top').value = state.positions.cam1.top;
    document.getElementById('valCam1Top').innerText = `${state.positions.cam1.top}px`;

    document.getElementById('rngCam1Left').value = state.positions.cam1.left;
    document.getElementById('valCam1Left').innerText = `${state.positions.cam1.left}px`;

    document.getElementById('rngCam2Top').value = state.positions.cam2.top;
    document.getElementById('valCam2Top').innerText = `${state.positions.cam2.top}px`;

    document.getElementById('rngCam2Left').value = state.positions.cam2.left;
    document.getElementById('valCam2Left').innerText = `${state.positions.cam2.left}px`;

    document.getElementById('rngCamWidth').value = state.positions.cam1.width;
    document.getElementById('valCamSize').innerText = `${state.positions.cam1.width} x ${state.positions.cam1.height}`;
  }
}

// Cập nhật nút Scene đang chọn
function updateActiveSceneButton() {
  document.querySelectorAll('.btn-scene').forEach(btn => btn.classList.remove('active'));
  
  if (state.currentScene === 'versus') {
    document.getElementById('btnSceneVersus').classList.add('active');
  } else if (state.currentScene === 'ingame') {
    document.getElementById('btnSceneIngame').classList.add('active');
  } else if (state.currentScene === 'winner') {
    if (state.winnerTarget === 'p1') {
      document.getElementById('btnSceneWinnerP1').classList.add('active');
    } else {
      document.getElementById('btnSceneWinnerP2').classList.add('active');
    }
  } else if (state.currentScene === 'hidden') {
    document.getElementById('btnSceneHidden').classList.add('active');
  }
}

// Trigger Chuyển Scene
function setScene(sceneName) {
  state.currentScene = sceneName;
  updateActiveSceneButton();
  broadcastState();
}

// Trigger Chuyển Winner
function setWinner(target) {
  state.winnerTarget = target;
  state.currentScene = 'winner';
  updateActiveSceneButton();
  broadcastState();
}

// Winner Text Quick Buttons
function applyQuickWinner(text) {
  state.winnerText = text;
  document.getElementById('winnerTextInput').value = text;
  broadcastState();
}

function updateWinnerText(val) {
  state.winnerText = val;
  broadcastState();
}

// Cập nhật thông tin tuyển thủ
function updatePlayerField(playerKey, field, value) {
  state[playerKey][field] = value;
  if (field === 'name') {
    document.getElementById('winnerP1Label').innerText = `WINNER ${state.p1.name || 'P1'}`;
    document.getElementById('winnerP2Label').innerText = `WINNER ${state.p2.name || 'P2'}`;
  }
  // Khi nhập link cam thật, tự động tắt chế độ Cam giả lập
  if (field === 'vdoUrl' && value.trim().length > 3) {
    state.useTestCam = false;
    const toggle = document.getElementById('testCamToggle');
    if (toggle) toggle.checked = false;
  }
  broadcastState();
}

// Thay đổi điểm số
function changeScore(playerKey, delta) {
  let newScore = state[playerKey].score + delta;
  if (newScore < 0) newScore = 0;
  state[playerKey].score = newScore;
  document.getElementById(`${playerKey}ScoreDisplay`).innerText = newScore;
  broadcastState();
}

function setScore(playerKey, value) {
  state[playerKey].score = value;
  document.getElementById(`${playerKey}ScoreDisplay`).innerText = value;
  broadcastState();
}

function resetScores() {
  state.p1.score = 0;
  state.p2.score = 0;
  document.getElementById('p1ScoreDisplay').innerText = 0;
  document.getElementById('p2ScoreDisplay').innerText = 0;
  broadcastState();
}

// Đổi bên 1P ↔ 2P
function swapSides() {
  const temp = JSON.parse(JSON.stringify(state.p1));
  state.p1 = JSON.parse(JSON.stringify(state.p2));
  state.p2 = temp;
  renderUI();
  broadcastState();
}

// Thể thức & Giải đấu
function setBo(boValue) {
  state.bo = boValue;
  renderUI();
  broadcastState();
}

function updateMatchPhase(val) {
  state.matchPhase = val;
  broadcastState();
}

function updateTournamentName(val) {
  state.tournamentName = val;
  broadcastState();
}

function toggleTestCam(checked) {
  state.useTestCam = checked;
  broadcastState();
}

// Accordion & Positioning Fine-tuning
function toggleAccordion() {
  const acc = document.getElementById('accordionTuning');
  acc.classList.toggle('open');
  const arrow = document.getElementById('accordionArrow');
  arrow.innerText = acc.classList.contains('open') ? '▲' : '▼';
}

function updatePos(key, val) {
  val = parseInt(val, 10);
  state.positions[key] = val;

  const rng1 = document.getElementById('rngPillarWidth');
  const rng2 = document.getElementById('rngPillarWidthMain');
  const lbl1 = document.getElementById('valPillarWidth');
  const lbl2 = document.getElementById('valPillarWidthMain');

  if (rng1) rng1.value = val;
  if (rng2) rng2.value = val;
  if (lbl1) lbl1.innerText = `${val}px`;
  if (lbl2) lbl2.innerText = `${val}px`;

  broadcastState();
}

function setPillarPreset(val) {
  updatePos('pillarWidth', val);
}

function updateCamPos(camKey, prop, val) {
  val = parseInt(val, 10);
  state.positions[camKey][prop] = val;
  const labelId = `val${camKey.charAt(0).toUpperCase() + camKey.slice(1)}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
  const label = document.getElementById(labelId);
  if (label) label.innerText = `${val}px`;
  broadcastState();
}

function updateCamSize(widthVal) {
  widthVal = parseInt(widthVal, 10);
  // Giữ tỉ lệ 16:9
  const heightVal = Math.round(widthVal * (9 / 16));
  state.positions.cam1.width = widthVal;
  state.positions.cam1.height = heightVal;
  state.positions.cam2.width = widthVal;
  state.positions.cam2.height = heightVal;

  document.getElementById('valCamSize').innerText = `${widthVal} x ${heightVal}`;
  broadcastState();
}

function resetDefaultPositions() {
  state.positions = JSON.parse(JSON.stringify(DEFAULT_CONFIG.positions));
  renderUI();
  broadcastState();
}

// Bắt phím tắt nhanh (Hotkeys: 1, 2, 3, 4, 0)
function handleHotkeys(e) {
  // Không nhận phím tắt nếu đang gõ chữ trong ô input
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

  if (e.key === '1') setScene('versus');
  else if (e.key === '2') setScene('ingame');
  else if (e.key === '3') setWinner('p1');
  else if (e.key === '4') setWinner('p2');
  else if (e.key === '0' || e.key === 'Escape') setScene('hidden');
}

// Chạy khởi động
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
  window.addEventListener('keydown', handleHotkeys);
});

