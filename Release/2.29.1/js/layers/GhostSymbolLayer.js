// ghostSymbolLayer 설정 및 초기화 파일
class GhostSymbolLayerManager {
    constructor() {
        this.layer = null;
        this.symbols = new Map();
        this.isResourceLoaded = false;
        this.WOLF_FEET_OFFSET = 0.01;
    }

    /**
     * 엔진 준비 후 명시적으로 호출할 초기화 메서드
     */
    init() {
        if (typeof Module === "undefined" || !Module.JSLayerList) {
            console.error("XDWorld Module이 아직 로드되지 않았습니다.");
            return;
        }

        // 이미 생성되어 있다면 중복 생성 방지
        if (this.layer) return;

        // 1. 레이어 생성
        var layerList = new Module.JSLayerList(true);
        this.layer = layerList.createLayer("ghostsymbol_layer", Module.ELT_GHOST_3DSYMBOL);

        // 2. 3D 리소스(.3ds) 등록
        var self = this;
        Module.getGhostSymbolMap().insert({
            id: "wolf",
            url: "./data/wolf.3ds",
            callback: function (e) {
                console.log("🐺 Wolf 3D 모델 리소스 로드 완료");
                self.isResourceLoaded = true;
            }
        });
    }

    addWolvesWithTerrain(lon, lat, dLon, dLat, scaleFactor = 1.0) {
        if (!this.layer) {
            console.warn("레이어가 생성되지 않았습니다. init()을 먼저 호출하세요.");
            return;
        }

        if (!this.isResourceLoaded) {
            var self = this;
            setTimeout(function () {
                self.addWolvesWithTerrain(lon, lat, dLon, dLat, scaleFactor);
            }, 100);
            return;
        }

        var alt1 = Module.getMap().getTerrHeightFast(lon + dLon, lat + dLat);
        var alt2 = Module.getMap().getTerrHeightFast(lon + dLon * scaleFactor, lat + dLat * scaleFactor);

        if (alt1 > 150.0 || alt1 < 5.0) {
            var self = this;
            setTimeout(function () {
                self.addWolvesWithTerrain(lon, lat, dLon, dLat, scaleFactor);
            }, 100);
            return;
        }

        this._createWolf("wolf_obj_1", lon + dLon, lat + dLat, alt1 + this.WOLF_FEET_OFFSET);
        this._createWolf("wolf_obj_2", lon + dLon * scaleFactor, lat + dLat * scaleFactor, alt2 + this.WOLF_FEET_OFFSET);
    }

    _createWolf(id, x, y, z) {
        var wolf = Module.createGhostSymbol(id);
        wolf.setGhostSymbol("wolf");
        wolf.setPosition(new Module.JSVector3D(x, y, z));
        wolf.setScale(new Module.JSSize3D(3.0, 3.0, 3.0));
        wolf.setPickable(true);

        this.layer.addObject(wolf, 0);
        this.symbols.set(id, wolf);
    }

    toggleLayer(isVisible) {
        if (this.layer) {
            this.layer.setVisible(isVisible);
            if (typeof Module.XDRenderData === "function") {
                Module.XDRenderData();
            }
        }
    }
    /**
     * 오브젝트 이동 버튼 UI 위치 갱신 및 표시 제어
     * @param {boolean} display - 표시 여부
     * @param {Object} mapPosition - 지도 상의 JSVector3D 또는 {longitude, latitude, altitude} 객체
     */
    displayMovingButton(display, mapPosition) {
        var moveButton = document.getElementById("moving");
        if (!moveButton) return;

        if (display && mapPosition) {
            moveButton.style.display = "block";

            // 1. 지형 고도 빠르게 조회
            var terrainAlt = Module.getMap().getTerrHeightFast(mapPosition.longitude, mapPosition.latitude);

            // 2. 고도 예외 처리
            var targetAlt = (terrainAlt > 0) ? terrainAlt : mapPosition.altitude;
            var buttonPosition = new Module.JSVector3D(mapPosition.longitude, mapPosition.latitude, targetAlt);

            // 3. 3D 지점 좌표 -> 2D 화면(스크린) 좌표 변환
            var screenPosition = Module.getMap().MapToScreenPointEX(buttonPosition);
            
            // 4. UI 위치 설정 (버튼 중앙 오프셋 보정)
            moveButton.style.left = parseInt(screenPosition.x - 15) + "px";
            moveButton.style.top = parseInt(screenPosition.y - 15) + "px";
        } else {
            moveButton.style.display = "none";
        }
    }
}

// 안전하게 인스턴스만 생성되어 내보내집니다 (Module 접근 안함)
export const ghostSymbolLayer = new GhostSymbolLayerManager();