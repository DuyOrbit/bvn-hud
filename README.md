# BVN Tournament HUD - Bleach vs Naruto Stream Overlay System

Hệ thống Stream Overlay và Bảng Điều Khiển Trọng Tài (Admin Control Panel) chuyên nghiệp dành cho giải đấu tựa game **Bleach vs Naruto (BvN)**.

Tích hợp chuyển cảnh liền mạch 60fps qua OBS Studio, kết nối Webcam tuyển thủ qua **VDO.Ninja**, đồng bộ thời gian thực 0ms qua **Server-Sent Events (SSE)**.

---

## 🌟 Tính Năng Nổi Bật

1. **3 Scene Chuyển Cảnh Liền Mạch (Seamless Single-Source):**
   - **Scene Versus:** 2 webcam bay vào từ 2 mép màn hình chia đôi 50% - 50% (tự động căn giữa và lấp đầy 100% không dải đen), vạch năng lượng phân cách ở giữa, thanh tên và tỉ số trượt bung ra từ tâm sang hai bên.
   - **Scene Ingame:** 2 webcam co nhỏ bay lướt lên góc trời trống dưới thanh máu (không đè lên avatar tướng); bảng điểm trượt xuống ôm khít ngay trên đỉnh thanh máu màu cam của game; 2 dải viền hông (`140px`) lấp đầy viền đen ngoài khung game với hiệu ứng linh áp Bleach (xanh) & lửa chakra Naruto (cam).
   - **Scene Winner:** Webcam người thắng phóng to **100% full màn hình (1920x1080)**, webcam người thua mờ biến mất, thẻ danh hiệu nổi bật xuất hiện bên dưới kèm các nút điền nhanh 1-click.
   - **Scene Ẩn HUD:** Mờ toàn bộ HUD để phỏng vấn / giải lao.

2. **Bảng Điều Khiển Admin Đầy Đủ (`admin.html`):**
   - Đổi tên tuyển thủ, đội tuyển, tăng/giảm tỉ số nhanh (+/-).
   - Điền nhanh danh hiệu màn Winner (`WINNER GAME 1`, `MATCH WINNER`, `CHAMPION`,...).
   - Đổi bên nhanh (Swap Sides 1P ⇄ 2P) chỉ với 1 click.
   - Nút chọn thể thức thi đấu Bo1, Bo3, Bo5, Bo7.
   - Thanh trượt và nút preset căn chỉnh viền hông tùy ý theo kích thước khung game (`0px`, `140px`, `240px`).
   - Phím tắt nhanh: `1` (Versus), `2` (Ingame), `3` (Winner P1), `4` (Winner P2), `0` (Ẩn HUD).

3. **Realtime Sync Server (`server.js`):**
   - Chạy trên Node.js cổng `3000`.
   - Kết nối trình duyệt (Admin) và OBS Studio (Overlay) với độ trễ **0ms** qua Server-Sent Events (SSE).
   - Tự động lưu trạng thái vào file `state.json` (không mất dữ liệu khi F5 hoặc tắt máy).

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Khởi động Server
Click đúp vào file **`start.bat`** trong thư mục dự án (hoặc mở terminal chạy `node server.js`).
Server sẽ khởi chạy tại:
- **Admin Control:** `http://localhost:3000/admin.html`
- **OBS Overlay:** `http://localhost:3000/overlay.html`
- **Trang chủ:** `http://localhost:3000/`

### 2. Thiết lập trên OBS Studio
1. Trong OBS Studio, bấm `+` tại khung **Sources (Nguồn)** ➔ chọn **Browser (Trình duyệt)**.
2. Cài đặt các thông số:
   - **URL:** `http://localhost:3000/overlay.html`
   - **Width:** `1920`
   - **Height:** `1080`
   - Tick chọn *Shutdown source when not visible* và *Refresh browser when scene becomes active*.
3. Đặt Browser Source này **nằm đè lên trên** cửa sổ capture game Bleach vs Naruto.

### 3. Điều khiển trận đấu
- Mở `http://localhost:3000/admin.html` trên trình duyệt.
- Dán link VDO.Ninja của 2 tuyển thủ vào ô tương ứng.
- Bấm các nút Scene hoặc phím tắt `1`, `2`, `3`, `4` để chuyển cảnh mượt mà trên luồng stream!

---

## 📁 Cấu Trúc Dự Án
```
bvn-hud/
├── admin.html          # Giao diện bảng điều khiển Admin
├── overlay.html        # Giao diện Overlay trình chiếu 1920x1080 (OBS)
├── index.html          # Trang Launcher điều hướng
├── server.js           # Realtime HTTP & SSE Sync Server
├── start.bat           # File khởi chạy 1-click trên Windows
├── state.json          # File lưu trữ dữ liệu trận đấu
├── css/
│   ├── admin.css       # Giao diện Dark-mode Esports cho Admin
│   └── overlay.css     # Hoạt ảnh CSS 60fps GPU cho Overlay
└── js/
    ├── config.js       # Cấu hình mặc định & thông số tọa độ
    ├── admin.js        # Logic điều khiển Admin & phím tắt
    └── overlay.js      # Animation Engine & hiệu ứng Aura Canvas
```

---

## 📜 Bản quyền & Giấy phép
Dự án được xây dựng phục vụ cộng đồng giải đấu game **Bleach vs Naruto**.
