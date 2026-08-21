// 레이어 및 객체를 제어하는 메인 로직
import { tileLayer } from './layers/TileLayer.js';
import { ghostSymbolLayer } from './layers/GhostSymbolLayer.js';
import { mouseEvents } from './utils.js';

// 건물 레이어의 현재 표시 상태를 추적하는 플래그 Variable
let isBuildingVisible = true;

window.addEventListener("XDWorldLoaded", function() {
    console.log("🚀 3D 엔진 초기화 완료");

    // 레이어 및 마우스 이벤트 초기화
    tileLayer.init();
    ghostSymbolLayer.init();
    mouseEvents();

    //  늑대 생성 버튼 이벤트
    const addWolfBtn = document.getElementById("add-wolf-btn");
    if (addWolfBtn) {
        addWolfBtn.addEventListener("click", () => {
            ghostSymbolLayer.createNextWolf();
        });
    }

    //  건물 레이어 토글 버튼 이벤트 연동
    const toggleBuildingBtn = document.getElementById("toggle-building-btn");
    if (toggleBuildingBtn) {
        toggleBuildingBtn.addEventListener("click", () => {
            // 상태값 반전 (true -> false / false -> true)
            isBuildingVisible = !isBuildingVisible;

            // TileLayer 클래스 내부의 toggleLayer 메서드 호출
            tileLayer.toggleLayer(isBuildingVisible);

            // 버튼 UI 텍스트 업데이트
            if (isBuildingVisible) {
                toggleBuildingBtn.innerText = "🏢 건물 레이어 끄기";
            } else {
                toggleBuildingBtn.innerText = "🏢 건물 레이어 켜기";
            }
        });
    }
});