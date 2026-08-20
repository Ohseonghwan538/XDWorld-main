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

        // Place the button after converting map coordinates to screen coordinates
        var screenPosition = Module.getMap().MapToScreenPointEX(_mapPosition);
        moveButton.style.left = parseInt(screenPosition.x - 15) + "px";
        moveButton.style.top = parseInt(screenPosition.y - 15) + "px";

    } else {
        moveButton.style.display = "none";
    }
}

function displayObject() {
        var lon = 129.1283;
        var lat = 35.1708;
        var alt = 39.6870;
        var dLon = 0.0002;
        var dLat = 0.0006;
        var scaleFactor = 1.1;

    // Load model and Create multiple objects in the same layer
    Module.getGhostSymbolMap().insert({

        id: "wolf",
        url: "./data/wolf.3ds",
        callback: function (e) {

            var layerList = new Module.JSLayerList(true);
            var layer = layerList.createLayer("ghostsymbol_layer", Module.ELT_GHOST_3DSYMBOL);
            var alt = layer.altitude_offset = 5.5; 

            // 💡 [동일 레이어 내 객체 1 생성]
            var wolf1 = Module.createGhostSymbol("wolf_obj_1");
            wolf1.setGhostSymbol("wolf");
            wolf1.setPosition(new Module.JSVector3D(lon+dLon, lat+dLat, alt));
            wolf1.setScale(new Module.JSSize3D(3.0, 3.0, 3.0));
            wolf1.setPickable(true); // 선택 가능 설정
            layer.addObject(wolf1, 0);

            // 💡 [동일 레이어 내 객체 2 생성 - 약간 떨어진 위치]
            var wolf2 = Module.createGhostSymbol("wolf_obj_2");
            wolf2.setGhostSymbol("wolf");
            wolf2.setPosition(new Module.JSVector3D(lon+dLon*scaleFactor, lat+dLat*scaleFactor, alt));
            wolf2.setScale(new Module.JSSize3D(3.0, 3.0, 3.0));
            wolf2.setPickable(true); // 선택 가능 설정
            layer.addObject(wolf2, 0);

            GLOBAL.LAYER = layer;
        }
    });

    // Set mouse to select mode
    Module.XDSetMouseState(Module.MML_SELECT_POINT);

    // Add buildings layer
    Module.getTileLayerList().createXDServerLayer({
        url: "https://xdworld.vworld.kr",
        servername: "XDServer3d",
        name: "facility_build",
        type: 9,
        minLevel: 0,
        maxLevel: 15
    });

}
