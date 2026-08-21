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
     * [버튼 클릭 시 실행] 현재 카메라 중심 지점(건물 표면 포함)에 늑대 객체 생성
     */
    createNextWolf() {
        if (!this.layer || !this.isResourceLoaded) {
            console.warn("엔진 또는 3D 리소스가 아직 준비되지 않았습니다.");
            return;
        }

        // 1. 카메라 중심의 3D 지점(건물/지형 표면 좌표 포함) 구하기
        var cameraCenter = this._getCenterMapPosition();
        if (!cameraCenter) {
            console.warn("카메라 중심 좌표를 찾을 수 없습니다.");
            return;
        }

        var currentLon = cameraCenter.longitude;
        var currentLat = cameraCenter.latitude;

        // 2. 바닥 지형 고도 구하기
        var terrainAlt = Module.getMap().getTerrHeightFast(currentLon, currentLat);
        if (isNaN(terrainAlt) || terrainAlt <= -9999) terrainAlt = 0.0;

        // 3. ScreenToMapPointEX가 감지한 표면 고도(건물/오브젝트 높이 포함) 확인
        var surfaceAlt = cameraCenter.altitude;

        // 지형 고도와 표면 고도를 비교하여 더 높은 위치(건물 옥상 등)를 최종 바닥면으로 선택
        if (isNaN(surfaceAlt) || surfaceAlt < terrainAlt) {
            surfaceAlt = terrainAlt;
        }

        // 4. 최종 고도 = (건물 옥상 또는 지형 고도) + 발 오프셋
        var finalAlt = surfaceAlt + this.WOLF_FEET_OFFSET;

        // 5. 객체 ID 생성 및 객체 배치
        this.wolfCount++;
        var objectId = "wolf_obj_" + this.wolfCount;

        this._createWolf(objectId, currentLon, currentLat, finalAlt);
        console.log(`🐺 ${objectId} 생성 완료 (위도: ${currentLat.toFixed(6)}, 경도: ${currentLon.toFixed(6)}, 고도: ${finalAlt.toFixed(2)}m)`);

        // 6. 화면 즉시 재렌더링
        if (typeof Module.XDRenderData === "function") {
            Module.XDRenderData();
        }
    }

    /**
     * 화면 중앙 픽셀의 3D 표면 좌표(건물/지형) 구하기
     */
    _getCenterMapPosition() {
        if (!Module.canvas || !Module.getMap()) return null;

        var centerX = Module.canvas.width / 2;
        var centerY = Module.canvas.height / 2;

        // ScreenToMapPointEX는 건물 표면이 있을 경우 건물 옥상의 altitude를 반환합니다.
        var centerPos = Module.getMap().ScreenToMapPointEX(new Module.JSVector2D(centerX, centerY));

        if (!centerPos) {
            var camera = Module.getViewCamera();
            if (camera && typeof camera.getLookAt === "function") {
                centerPos = camera.getLookAt();
            }
        }

        return centerPos;
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

    /**
     * 고스트 심볼 레이어 표시 / 숨김 제어
     * @param {boolean} isVisible 
     */
    toggleLayer(isVisible) {
        if (this.layer && typeof this.layer.setVisible === "function") {
            this.layer.setVisible(isVisible);

            // 레이어를 끌 때 선택 해제 및 컨트롤 정리
            if (!isVisible) {
                if (typeof Module.getMap === "function" && Module.getMap()) {
                    Module.getMap().clearSelectObj();
                }

                this.isMoving = false;
                this.displayMovingButton(false);

                if (typeof Module.getControl === "function" && Module.getControl()) {
                    Module.getControl().activeMouse(true);
                }
            }

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

    /**
     * 객체 이동 버튼(+) 표출 및 위치 설정 (3D 타일 건물/오브젝트 고도 반영)
     * @param {boolean} _display - 버튼 표출 여부
     * @param {Module.JSVector3D} _mapPosition - 이동 대상 객체의 3D 지도 좌표
     */
    displayMovingButton(_display, _mapPosition) {
        var moveButton = document.getElementById("moving");
        if (!moveButton) return;

        if (_display && _mapPosition) {
            moveButton.style.display = "block";

            // 객체 위치의 지형 고도 측정
            var terrainAlt = Module.getMap().getTerrHeightFast(_mapPosition.longitude, _mapPosition.latitude);
            if (isNaN(terrainAlt) || terrainAlt <= -9999) terrainAlt = 0.0;

            // 객체 자체의 고도(건물/표면 높이가 포함된 altitude) 확인
            var surfaceAlt = _mapPosition.altitude;

            // 지형 고도와 객체 표면 고도를 비교하여 더 높은 곳(건물 옥상 등)을 버튼의 3D 기준 고도로 지정
            var targetAlt = (surfaceAlt > terrainAlt) ? surfaceAlt : terrainAlt;

            // 발끝/표면 고도 좌표를 3D 공간 벡터로 생성
            var buttonPosition = new Module.JSVector3D(_mapPosition.longitude, _mapPosition.latitude, targetAlt);

            // 3D 지도 좌표를 화면(Screen Pixel) 2D 좌표로 변환
            var screenPosition = Module.getMap().MapToScreenPointEX(buttonPosition);

            // 2D 캔버스 좌표에 맞춰 버튼 위치 배치 (버튼 중심점 보정: -15px)
            moveButton.style.left = parseInt(screenPosition.x - 15) + "px";
            moveButton.style.top = parseInt(screenPosition.y - 15) + "px";

        } else {
            moveButton.style.display = "none";
        }
    }
}

// 안전하게 인스턴스만 생성되어 내보내집니다 (Module 접근 안함)
export const ghostSymbolLayer = new GhostSymbolLayerManager();