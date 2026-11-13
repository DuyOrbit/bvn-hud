/**
 * BVN TOURNAMENT HUD - DEFAULT CONFIGURATION
 */
const DEFAULT_CONFIG = {
  // Trận đấu
  tournamentName: "BLEACH VS NARUTO CHAMPIONSHIP",
  matchPhase: "VÒNG BÁN KẾT - BO3",
  bo: 3,

  // Player 1 (Bleach Theme)
  p1: {
    name: "PLAYER 1",
    team: "GOTEI 13",
    score: 0,
    character: "Kurosaki Ichigo",
    vdoUrl: ""
  },

  // Player 2 (Naruto Theme)
  p2: {
    name: "PLAYER 2",
    team: "KONOHA",
    score: 0,
    character: "Naruto Uzumaki",
    vdoUrl: ""
  },

  // Trạng thái Scene: 'versus' | 'ingame' | 'winner' | 'hidden'
  currentScene: "versus",
  winnerTarget: "p1", // 'p1' | 'p2'
  winnerText: "WINNER GAME 1",

  // Tọa độ Ingame căn chỉnh (Pixel trên khung 1920x1080)
  positions: {
    pillarWidth: 140,        // Chuẩn 140px khớp khít 2 dải đen ngoài rìa (không che game)
    cam1: { top: 165, left: 240, width: 290, height: 165 }, // Cam 1P góc trời dưới Ichigo
    cam2: { top: 165, left: 1390, width: 290, height: 165 }, // Cam 2P góc trời dưới Temari
    topBar: { top: 58, height: 38, centerGap: 165 }          // Nằm ngay sát trên thanh máu
  },

  // Cài đặt hiển thị
  useTestCam: true // Dùng video test giả lập nếu chưa có link VDO.Ninja
};

const HUD_CHANNEL_NAME = "bvn_hud_broadcast_channel";
const HUD_STORAGE_KEY = "bvn_hud_state_v1";

