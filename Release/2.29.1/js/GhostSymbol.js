var GLOBAL = {

	// Ghost symbol object layer
	LAYER : null,

	// Status(dragging the model)
	MODEL_MOVING : false
};

var Module = {

	locateFile : function(s) {
		return "./engine/"+ s;
	},
	postRun: function() {
		
		// Call engine initialization API(essential)
		Module.initialize({
			container: document.getElementById("map"),
			terrain : {
				dem : {
					url : "https://xdworld.vworld.kr",
					name : "dem",
					servername : "XDServer3d",
					encoding : true
				},
				image : {
					url : "https://xdworld.vworld.kr",
					name : "tile",
					servername : "XDServer3d"
				}
			},
			worker : {
				use : true,
				path : "./worker/XDWorldWorker.js",
				count : 5
			},
			defaultKey : "eza2eBBqd!Hmd!JQ45QpEpB~#Fb!EQBmeFDP4FEPDzb1dFg21I=="
		});

		// Set camera
		Module.getViewCamera().setLocation(new Module.JSVector3D(129.12834886231374, 35.17143480442383, 39.687070820480585));

		// Load model and Create object
		Module.getGhostSymbolMap().insert({
			
			id : "wolf",
			url : "./data/WOLF.3DS",
			callback : function(e) {
				
				// Set camera
				var wolf = Module.createGhostSymbol("copy_wolf");
				wolf.setGhostSymbol("wolf");
				wolf.setPosition(new Module.JSVector3D(129.12834886231374, 35.17143480442383, 4.074109984561801));
				wolf.setScale(new Module.JSSize3D(3.0, 3.0, 3.0));
	            
				var layerList = new Module.JSLayerList(true);
				var layer = layerList.createLayer("ghostsymbol_layer", Module.ELT_GHOST_3DSYMBOL);
				layer.addObject(wolf, 0);

				GLOBAL.LAYER = layer;
			}
		});

		// Set mouse to select mode
		Module.XDSetMouseState(Module.MML_SELECT_POINT);

        // Add buildings layer
        Module.getTileLayerList().createXDServerLayer({
            url : "https://xdworld.vworld.kr",
            servername : "XDServer3d",
            name : "facility_build",
            type : 9,
            minLevel : 0,
            maxLevel : 15
        });

		// Set event
		initEvent();
	}
};

var script = document.createElement('script');
script.src = "https://cdn.xdworld.kr/stable/XDWorldEM.js";
document.body.appendChild(script);

/* Set event */
function initEvent() {

	// Object selection event setup
	Module.canvas.addEventListener("Fire_EventSelectedObject", function(e) {
	
		// Return the selected object based on the event key parameter
		var object = GLOBAL.LAYER.keyAtObject(e.objKey);
		if (object == null) {
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

		// Object movement state on
		GLOBAL.MODEL_MOVING = true;

		Module.getMap().getSelectObject().setPickable(false);
        Module.getControl().activeMouse(false);
	};

	movingButton.onmouseup = function(){

		// Object movement state off
		GLOBAL.MODEL_MOVING = false;

		Module.getMap().getSelectObject().setPickable(true);
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
            if (e.buttons > 0) {
                Module.getMap().clearSelectObj();
                displayMovingButton(false);
            }
        }
    };

    // 지형 좌표 변환 및 객체 위치 업데이트 전담 함수
    function updateObjectPosition() {
        isPendingRaf = false;

        if (!GLOBAL.MODEL_MOVING || !lastMouseEvent) return;

        // Return the selected object
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

            // 지형 판독 성공 시 좌표 반영 및 null 체크 예외 방어
            if (targetPosition) {
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
	if (_display) {
		
		moveButton.style.display = "block";

		// Place the button after converting map coordinates to screen coordinates
		var screenPosition = Module.getMap().MapToScreenPointEX(_mapPosition);
		moveButton.style.left = parseInt(screenPosition.x-15) + "px";
		moveButton.style.top = parseInt(screenPosition.y-15) + "px";

	} else {
		moveButton.style.display = "none";
	}
}