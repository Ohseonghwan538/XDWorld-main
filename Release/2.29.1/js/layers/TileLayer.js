// js/layers/TileLayer.js

class TileLayerManager {
    constructor() {
        this.layer = null;
        this.layerName = "facility_build";
    }

    /**
     * XDServer 건물 3D 타일 레이어 초기화
     */
    init() {
        if (typeof Module === "undefined" || !Module.getTileLayerList) {
            console.error("XDWorld Module이 아직 로드되지 않았습니다.");
            return;
        }

        // 이미 생성되어 있다면 중복 생성 방지
        if (this.layer) return;

        // VWorld 3D 건물 타일 레이어 생성 및 옵션 설정
        this.layer = Module.getTileLayerList().createXDServerLayer({
            url: "https://xdworld.vworld.kr",
            servername: "XDServer3d",
            name: this.layerName,
            type: 9, // 3D 시설물/건물 타일 타입
            minLevel: 0,
            maxLevel: 15
        });

        if (this.layer) {
            console.log(`🏢 타일 레이어 [${this.layerName}] 생성 완료`);
            this.refresh();
        }
    }

    /**
     * 타일 레이어 표시 / 숨김 제어
     * @param {boolean} isVisible 
     */
    toggleLayer(isVisible) {
        if (this.layer && typeof this.layer.setVisible === "function") {
            this.layer.setVisible(isVisible);
            this.refresh();
        }
    }

    /**
     * 화면 강제 갱신
     */
    refresh() {
        if (typeof Module.XDRenderData === "function") {
            Module.XDRenderData();
        }
    }
}

export const tileLayer = new TileLayerManager();