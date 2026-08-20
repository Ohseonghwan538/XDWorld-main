/* Set event */
function initEvent() {

    // Object selection event setup (동일 레이어 내에서 클릭된 개별 객체 식별)
    Module.canvas.addEventListener("Fire_EventSelectedObject", function(e) {
    
        // 💡 선택된 객체의 키(Key) 값을 통해 동일 레이어 내에서 해당 개체 추출
        var object = GLOBAL.LAYER.keyAtObject(e.objKey);
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
            GLOBAL.MODEL_MOVING = true;

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
        GLOBAL.MODEL_MOVING = false;
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
        if (GLOBAL.MODEL_MOVING) {

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
            if (e.buttons > 0 && !GLOBAL.MODEL_MOVING) {
                Module.getMap().clearSelectObj();
                displayMovingButton(false);
            }
        }
    };

    // 지형 좌표 변환 및 선택된 객체 위치 업데이트 전담 함수
    function updateObjectPosition() {
        isPendingRaf = false;

        if (!GLOBAL.MODEL_MOVING || !lastMouseEvent) return;

        // 💡 엔진의 Select 상태에 있는 '단 하나의 객체'만 추려내어 이동
        var selectedObject = Module.getMap().getSelectObject();
        if (selectedObject) {

            // Canvas Rect 및 Scale 보정을 거친 정확한 Screen 좌표 전달
            var rect = Module.canvas.getBoundingClientRect();
            var scaleX = Module.canvas.width / rect.width;
            var scaleY = Module.canvas.height / rect.height;

            var canvasX = (lastMouseEvent.clientX - rect.left) * scaleX;
            var canvasY = (lastMouseEvent.clientY - rect.top) * scaleY;

            // Move the object by converting screen coordinates to map coordinates
            var targetPosition = Module.getMap().ScreenToMapPointEX(new Module.JSVector2D(canvasX, canvasY));

            // 지형 판독 성공 시 해당 개체의 좌표만 업데이트
            if (targetPosition) {
                selectedObject.setPosition(targetPosition);
            }
        }
    }
}