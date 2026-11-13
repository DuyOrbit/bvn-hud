const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATE_FILE = path.join(__dirname, 'state.json');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// Cấu hình mặc định ban đầu
const DEFAULT_CONFIG = {
  tournamentName: "BLEACH VS NARUTO CHAMPIONSHIP",
  matchPhase: "VÒNG BÁN KẾT - BO3",
  bo: 3,
  p1: {
    name: "PLAYER 1",
    team: "GOTEI 13",
    score: 0,
    character: "Kurosaki Ichigo",
    vdoUrl: ""
  },
  p2: {
    name: "PLAYER 2",
    team: "KONOHA",
    score: 0,
    character: "Naruto Uzumaki",
    vdoUrl: ""
  },
  currentScene: "versus",
  winnerTarget: "p1",
  winnerText: "WINNER GAME 1",
  positions: {
    pillarWidth: 240,
    cam1: { top: 130, left: 260, width: 290, height: 165 },
    cam2: { top: 130, left: 1370, width: 290, height: 165 },
    topBar: { top: 10, height: 42, centerGap: 90 }
  },
  useTestCam: true
};

// Load state từ file nếu có
let currentState = Object.assign({}, DEFAULT_CONFIG);
if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    currentState = Object.assign({}, DEFAULT_CONFIG, JSON.parse(raw));
    console.log("-> Đã khôi phục dữ liệu trận đấu gần nhất từ state.json");
  } catch (err) {
    console.warn("Lỗi đọc file state.json, dùng cấu hình mặc định");
  }
}

// Danh sách các client đang kết nối realtime (OBS Studio & Trình duyệt Chrome)
const sseClients = new Set();

function broadcastToClients(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE REALTIME ENDPOINT (Đồng bộ tức thì 0ms giữa Chrome và OBS Studio)
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Gửi ngay trạng thái hiện tại cho client vừa kết nối
    res.write(`data: ${JSON.stringify(currentState)}\n\n`);
    sseClients.add(res);
    console.log(`[REALTIME] Thiết bị kết nối mới (OBS / Chrome). Tổng client: ${sseClients.size}`);

    req.on('close', () => {
      sseClients.delete(res);
      console.log(`[REALTIME] Thiết bị ngắt kết nối. Còn lại: ${sseClients.size}`);
    });
    return;
  }

  // 2. API CẬP NHẬT TRẠNG THÁI TỪ ADMIN
  if (pathname === '/api/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newState = JSON.parse(body);
        currentState = Object.assign({}, currentState, newState);

        // Lưu vào file state.json để không bị mất dữ liệu
        fs.writeFile(STATE_FILE, JSON.stringify(currentState, null, 2), () => {});

        // Bắn tín hiệu sang OBS ngay lập tức
        broadcastToClients(currentState);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, clients: sseClients.size }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 3. API LẤY TRẠNG THÁI HIỆN TẠI
  if (pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentState));
    return;
  }

  // 4. PHỤC VỤ FILE TĨNH (HTML, CSS, JS)
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  BVN TOURNAMENT HUD REALTIME SERVER IS ONLINE!`);
  console.log(`  - Admin Control:   http://localhost:${PORT}/admin.html`);
  console.log(`  - OBS Overlay:     http://localhost:${PORT}/overlay.html`);
  console.log(`  - Realtime Sync:   Server-Sent Events 0ms`);
  console.log(`=======================================================`);
});
