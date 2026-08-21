import { tileLayer } from './layers/TileLayer.js';
import { ghostSymbolLayer } from './layers/GhostSymbolLayer.js';
import { mouseEvents } from './utils.js';

// 선택된 오브젝트 정보를 저장할 변수
let selectedObject = null;

// 1. 엔진 초기화 완료 이벤트 수신
window.addEventListener("XDWorldLoaded", function() {
    console.log("🚀 3D 엔진 초기화 완료 - 레이어 및 이벤트 등록 시작");

    // 타일 및 심볼 레이어 초기화
    tileLayer.init();
    ghostSymbolLayer.init();

    // 마우스 선택 및 화면 렌더링 이벤트 바인딩
    mouseEvents();

    // 늑대 심볼 생성
    ghostSymbolLayer.addWolvesWithTerrain(129.1285, 35.1709, 0.001, 0.001, 1.0);


});