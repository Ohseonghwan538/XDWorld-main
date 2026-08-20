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
        Module.getViewCamera().setLocation(new Module.JSVector3D(129.1285, 35.1709, 39.687070820480585));
        //Module.getViewCamera().setLocation(new Module.JSVector3D(lon, lat, alt));

        /**
         * 카메라 설정
         */
        // 상하(Tilt) 회전
        Module.getViewCamera().setTilt(30.0);
        Module.getViewCamera().setFov(20);

        // Module.getViewCamera().AltitudeDown(true); // 지형에 따라 카메라 높이 자동 조정

        // Module.getViewCamera().setAltitude(500)

        displayObject();

        // Set event
        initEvent();
    }
};

var script = document.createElement('script');
script.src = "https://cdn.xdworld.kr/stable/XDWorldEM.js";
document.body.appendChild(script);

