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

        /**
         * 카메라 설정
         */

        // 위치 설정
        // Module.getViewCamera().setLocation(new Module.JSVector3D(129.1285, 35.1709, 39.687070820480585));
        // 상하(Tilt) 회전
        //Module.getViewCamera().setTilt(30.0);
        // 위치 및 위/아래 회전 설정
        Module.getViewCamera().move(new Module.JSVector3D(129.1285, 35.1709, 39.687070820480585), 30, 0, 0);
        
        // 화각 조정
        Module.getViewCamera().setFov(20);
        // Module.getViewCamera().setAltitude(500)

        // 엔진 초기화 완료 후 전역 이벤트로 신호 발신 (main.js가 받을 수 있도록)
        window.dispatchEvent(new CustomEvent("XDWorldLoaded"));   
    }
};


