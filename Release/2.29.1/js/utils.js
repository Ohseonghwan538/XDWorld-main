import { ghostSymbolLayer } from './layers/GhostSymbolLayer.js';

/* Set event */
export function mouseEvents() {
    // 마우스 상태를 포인트 선택 모드로 설정
    Module.XDSetMouseState(Module.MML_SELECT_POINT);

    // Object selection event setup (동일 레이어 내에서 클릭된 개별 객체 식별)
    Module.canvas.addEventListener("Fire_EventSelectedObject", function(e) {
    
        // 💡 선택된 객체의 키(Key) 값을 통해 동일 레이어 내에서 해당 개체 추출
        var targetLayer = ghostSymbolLayer.layer;
        if (!targetLayer) {
            displayMovingButton(false);
            return;
        }

        var object = targetLayer.keyAtObject(e.objKey);
        if (object == null) {
            displayMovingButton(false);
            return;
        }
    
        // Calculate the latitude, longitude, and altitude coordinates of the selected object's bottom surface
        var position = object.getPosition();
        position.Altitude += (object.getScale().depth * object.getBasePointY());

        // Display the move button at the selected object's position
        displayMovingButton(true, position);
    });

    // Object movement button event setup
    var movingButton = document.getElementById("moving");
    movingButton.onmousedown = function(){

        var selectedObject = Module.getMap().getSelectObject();
        if (selectedObject) {
            // Object movement state on
            window.MODEL_MOVING = true;

            // 선택된 객체의 피킹을 잠시 꺼서 마우스 레이캐스팅 방해 금지
            selectedObject.setPickable(false);
            Module.getControl().activeMouse(false);
        }
    };

    movingButton.onmouseup = function(){

        var selectedObject = Module.getMap().getSelectObject();
        if (selectedObject) {
            selectedObject.setPickable(true);
        }

        // Object movement state off
        window.MODEL_MOVING = false;
        Module.getControl().activeMouse(true);
    };
    
    Module.canvas.onmousewheel = function() {

        // Deselect the object and hide the object movement button if no object is selected
        Module.getMap().clearSelectObj();
        displayMovingButton(false);
    };
    
    Module.canvas.onmouseup = function() {

        // Hide the object movement button if no object is selected
        var selectedObject = Module.getMap().getSelectObject();
        if (selectedObject == null) {
            displayMovingButton(false);
        }
    };

    // rAF 프레임 제어 및 마우스 위치 저장용 변수
    var isPendingRaf = false;
    var lastMouseEvent = null;

    Module.canvas.onmousemove = function (e) {

        // Move the spherical object according to the mouse position if the object movement state is on
        if (window.MODEL_MOVING) {

            // 최신 마우스 이벤트 저장
            lastMouseEvent = e;

            // Realign the object movement button according to the mouse drag position (UI는 즉시 반응)
            var movingButton = document.getElementById("moving");
            if (movingButton) {
                movingButton.style.left = (e.clientX - 15) + 'px';
                movingButton.style.top = (e.clientY - 15) + 'px';
            }

            // 프레임 요청이 아직 안 걸려있을 때만 rAF 호출
            if (!isPendingRaf) {
                isPendingRaf = true;
                requestAnimationFrame(updateObjectPosition);
            }

        } else {

            // Hide the object movement button being displayed and deselect the object when not using the object movement button
            if (e.buttons > 0 && !window.MODEL_MOVING) {
                Module.getMap().clearSelectObj();
                displayMovingButton(false);
            }
        }
    };
    // 지형 좌표 및 3D 건물 표면 좌표 변환 전담 함수
    function updateObjectPosition() {
        isPendingRaf = false;

        if (!window.MODEL_MOVING || !lastMouseEvent) return;

        var selectedObject = Module.getMap().getSelectObject();
        if (selectedObject) {

            var rect = Module.canvas.getBoundingClientRect();
            var scaleX = Module.canvas.width / rect.width;
            var scaleY = Module.canvas.height / rect.height;

            var canvasX = (lastMouseEvent.clientX - rect.left) * scaleX;
            var canvasY = (lastMouseEvent.clientY - rect.top) * scaleY;

            // 💡 ScreenToMapPointEX는 지형뿐만 아니라 화면 내 3D 객체/건물 표면의 (Lon, Lat, Alt)를 반환합니다.
            var targetPosition = Module.getMap().ScreenToMapPointEX(new Module.JSVector2D(canvasX, canvasY));

            if (targetPosition) {
                // 💡 1. 순수 지형(DEM) 높이 취득
                var terrainAlt = Module.getMap().getTerrHeightFast(targetPosition.longitude, targetPosition.latitude);

                // 💡 2. ScreenToMapPointEX가 집어낸 고도(targetPosition.altitude)가 지형보다 높다면 '건물 위'로 판단
                var surfaceAlt = targetPosition.altitude;
                if (surfaceAlt < terrainAlt) {
                    surfaceAlt = terrainAlt;
                }

                // 💡 3. 건물 표면 또는 지형 표면 고도에 발바닥 보정값(1.2) 추가
                var WOLF_FEET_OFFSET = 1.3;
                targetPosition.altitude = surfaceAlt + WOLF_FEET_OFFSET;

                // 💡 4. 최종 고도 적용
                selectedObject.setPosition(targetPosition);
            }
        }
    }
}

/* Set the display of the object movement button */
function displayMovingButton(_display, _mapPosition) {

    // Return the element
    var moveButton = document.getElementById("moving");
    if (moveButton == null) {
        return;
    }

    // Set the button display
    if (_display && _mapPosition) {
        
        moveButton.style.display = "block";

        // 💡 1. 현재 객체 위치(경도, 위도)의 지형 고도를 빠르게 가져옵니다.
        var terrainAlt = Module.getMap().getTerrHeightFast(_mapPosition.longitude, _mapPosition.latitude);

        // 💡 2. 버튼 제어 포인트의 고도를 발끝(지면) 고도로 맞춘 좌표 생성
        // (만약 지형 고도가 아직 0인 경우 기존 고도를 유지하도록 예외 처리)
        var targetAlt = (terrainAlt > 0) ? terrainAlt : _mapPosition.altitude;
        var buttonPosition = new Module.JSVector3D(_mapPosition.longitude, _mapPosition.latitude, targetAlt);

        // 💡 3. 발끝 지면 고도 좌표를 화면(Screen) 2D 좌표로 변환
        var screenPosition = Module.getMap().MapToScreenPointEX(buttonPosition);
        
        moveButton.style.left = parseInt(screenPosition.x - 15) + "px";
        moveButton.style.top = parseInt(screenPosition.y - 15) + "px";

    } else {
        moveButton.style.display = "none";
    }
}