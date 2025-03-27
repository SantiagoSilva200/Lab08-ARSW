var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;

    var showAlertWithCoordinates = function (message) {
        var receivedPoint = JSON.parse(message.body);
        var x = receivedPoint.x;
        var y = receivedPoint.y;
        alert(`Received point - X: ${x}, Y: ${y}`);
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WebSocket...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', showAlertWithCoordinates);
        });
    };

    return {
        init: function () {
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publicando punto en " + JSON.stringify(pt));

            if (stompClient) {
                stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Desconectado");
        }
    };

})();
