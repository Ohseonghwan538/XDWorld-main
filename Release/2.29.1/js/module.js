// 모듈 생성 파일
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

        /**
         * 카메라 설정
         */
        // 상하(Tilt) 회전
        Module.getViewCamera().setTilt(30.0);
        // 화각 조절
        Module.getViewCamera().setFov(20);
        // Module.getViewCamera().AltitudeDown(true); // 지형에 따라 카메라 높이 자동 조정
        // Module.getViewCamera().setAltitude(500)

        // 엔진 초기화 완료 후 전역 이벤트로 신호 발신 (main.js가 받을 수 있도록)
        window.dispatchEvent(new CustomEvent("XDWorldLoaded"));   
    }
};


