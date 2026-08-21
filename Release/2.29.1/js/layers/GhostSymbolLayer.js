// ghostSymbolLayer 설정 및 초기화 파일
class GhostSymbolLayerManager {
    constructor() {
        this.layer = null;
        this.symbols = new Map();
        this.isResourceLoaded = false;
        this.WOLF_FEET_OFFSET = 1.3;
        this.isMoving = false;

        // 💡 rAF 상태 제어용 변수를 클래스 상태로 관리
        this.isPendingRaf = false;
        this.lastMouseEvent = null;

        this.wolfCount = 0;
        this.baseLocation = {
            lon: 129.1283,
            lat: 35.1708,
            dLon: 0.0002,
            dLat: 0.0006,
            scaleFactor: 1.1
        };
    }

    init() {
        if (typeof Module === "undefined" || !Module.JSLayerList) return;
        if (this.layer) return;

        var layerList = new Module.JSLayerList(true);
        this.layer = layerList.createLayer("ghostsymbol_layer", Module.ELT_GHOST_3DSYMBOL);

        var self = this;
        Module.getGhostSymbolMap().insert({
            id: "wolf",
            url: "./data/wolf.3ds",
            callback: function () {
                console.log("🐺 Wolf 3D 모델 리소스 로드 완료");
                self.isResourceLoaded = true;
            }
        });
    }

    /**
     * 마우스 이벤트 및 rAF 기반 위치 업데이트 최적화 바인딩
     */
    initMouseEvents() {
        if (!this.layer) return;
        var self = this;

        // 마우스 이동 시 rAF 최적화 처리
        Module.canvas.onmousemove = function (e) {
            if (self.isMoving) {
                // 최신 마우스 이벤트만 갱신
                self.lastMouseEvent = e;

                // 이동 UI 버튼은 화면 픽셀 변환이므로 마우스 반응성을 위해 즉시 이동
                var movingBtn = document.getElementById("moving");
                if (movingBtn) {
                    movingBtn.style.left = (e.clientX - 15) + 'px';
                    movingBtn.style.top = (e.clientY - 15) + 'px';
                }

                // 💡 이미 다음 프레임 요청이 대기 중이지 않은 경우에만 rAF 요청
                if (!self.isPendingRaf) {
                    self.isPendingRaf = true;
                    // 화살표 함수를 사용하여 this(클래스 인스턴스) 참조 유지
                    requestAnimationFrame(() => self.updateObjectPosition());
                }
            } 
        };
    }

    /**
     * 💡 rAF에 의해 매 프레임마다 실행되는 3D 객체 위치 업데이트 함수
     */
    updateObjectPosition() {
        // 프레임 처리가 시작되었으므로 대기 플래그 해제
        this.isPendingRaf = false;

        if (!this.isMoving || !this.lastMouseEvent) return;

        var selectedObject = Module.getMap().getSelectObject();
        if (selectedObject) {
            var rect = Module.canvas.getBoundingClientRect();
            var scaleX = Module.canvas.width / rect.width;
            var scaleY = Module.canvas.height / rect.height;

            var canvasX = (this.lastMouseEvent.clientX - rect.left) * scaleX;
            var canvasY = (this.lastMouseEvent.clientY - rect.top) * scaleY;

            var targetPosition = Module.getMap().ScreenToMapPointEX(new Module.JSVector2D(canvasX, canvasY));

            if (targetPosition) {
                var terrainAlt = Module.getMap().getTerrHeightFast(targetPosition.longitude, targetPosition.latitude);
                var surfaceAlt = targetPosition.altitude;
                if (surfaceAlt < terrainAlt) {
                    surfaceAlt = terrainAlt;
                }

                targetPosition.altitude = surfaceAlt + this.WOLF_FEET_OFFSET;
                selectedObject.setPosition(targetPosition);

                // 위치 변경 후 즉시 프레임 재렌더링
                if (typeof Module.XDRenderData === "function") {
                    Module.XDRenderData();
                }
            }
        }
    }

    /**
     * [버튼 클릭 시 실행] 늑대 객체를 계속 생성하는 메서드
     */
    createNextWolf() {
        if (!this.layer || !this.isResourceLoaded) {
            console.warn("엔진 또는 3D 리소스가 아직 준비되지 않았습니다.");
            return;
        }

        this.wolfCount++;
        var count = this.wolfCount;
        var p = this.baseLocation;

        var currentLon, currentLat;

        if (count === 1) {
            // 첫 번째 늑대: lon + dLon, lat + dLat
            currentLon = p.lon + p.dLon;
            currentLat = p.lat + p.dLat;
        } else {
            // 이후 늑대: lon + dLon * (scaleFactor ^ (count - 1))
            var factor = Math.pow(p.scaleFactor, count - 1);
            currentLon = p.lon + p.dLon * factor;
            currentLat = p.lat + p.dLat * factor;
        }

        // 지형 고도 계산
        var terrainAlt = Module.getMap().getTerrHeightFast(currentLon, currentLat);
        if (isNaN(terrainAlt) || terrainAlt <= -9999) terrainAlt = 10.0;

        var finalAlt = terrainAlt + this.WOLF_FEET_OFFSET;
        var objectId = "wolf_obj_" + count;

        // 객체 생성
        this._createWolf(objectId, currentLon, currentLat, finalAlt);
        console.log(`🐺 ${objectId} 생성 완료 (위도: ${currentLat}, 경도: ${currentLon})`);

        // 화면 즉시 재렌더링
        if (typeof Module.XDRenderData === "function") {
            Module.XDRenderData();
        }
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
}

// 안전하게 인스턴스만 생성되어 내보내집니다 (Module 접근 안함)
export const ghostSymbolLayer = new GhostSymbolLayerManager();