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

function displayObject() {
    var lon = 129.1283;
    var lat = 35.1708;
    var dLon = 0.0002;
    var dLat = 0.0006;
    var scaleFactor = 1.1;

    Module.getGhostSymbolMap().insert({
        id: "wolf",
        url: "./data/wolf.3ds",
        callback: function (e) {

            var layerList = new Module.JSLayerList(true);
            var layer = layerList.createLayer("ghostsymbol_layer", Module.ELT_GHOST_3DSYMBOL);

            // 늑대 모델 중심점(몸통) -> 발바닥 고도 보정값
            var WOLF_FEET_OFFSET = 0.01; 

            function createWolvesWithTerrain() {
                var alt1 = Module.getMap().getTerrHeightFast(lon + dLon, lat + dLat);
                var alt2 = Module.getMap().getTerrHeightFast(lon + dLon * scaleFactor, lat + dLat * scaleFactor);

                if (alt1 > 150.0 || alt1 < 5.0) {
                    setTimeout(createWolvesWithTerrain, 100);
                    return;
                }

                console.log("⚡ [Fast 지형 고도]:", alt1, "| 발바닥 고도:", alt1 + WOLF_FEET_OFFSET);

                // [객체 1 생성]
                var wolf1 = Module.createGhostSymbol("wolf_obj_1");
                wolf1.setGhostSymbol("wolf");
                wolf1.setPosition(new Module.JSVector3D(lon + dLon, lat + dLat, alt1 + WOLF_FEET_OFFSET));
                wolf1.setScale(new Module.JSSize3D(3.0, 3.0, 3.0));
                wolf1.setPickable(true);
                layer.addObject(wolf1, 0);

                // [객체 2 생성]
                var wolf2 = Module.createGhostSymbol("wolf_obj_2");
                wolf2.setGhostSymbol("wolf");
                wolf2.setPosition(new Module.JSVector3D(lon + dLon * scaleFactor, lat + dLat * scaleFactor, alt2 + WOLF_FEET_OFFSET));
                wolf2.setScale(new Module.JSSize3D(3.0, 3.0, 3.0));
                wolf2.setPickable(true);
                layer.addObject(wolf2, 0);

                GLOBAL.LAYER = layer;
            }

            createWolvesWithTerrain();
        }
    });

    Module.XDSetMouseState(Module.MML_SELECT_POINT);

    Module.getTileLayerList().createXDServerLayer({
        url: "https://xdworld.vworld.kr",
        servername: "XDServer3d",
        name: "facility_build",
        type: 9,
        minLevel: 0,
        maxLevel: 15
    });
}