var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var canvas = null;
    var ctx = null;

    // Función para dibujar un punto en el canvas
    var drawPoint = function(point) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#0000FF'; // Color azul para los puntos
        ctx.fill();
    };

    // Función para manejar los puntos recibidos
    var handleReceivedPoint = function(message) {
        try {
            var receivedPoint = JSON.parse(message.body);
            drawPoint(receivedPoint);
        } catch (e) {
            console.error("Error al procesar punto recibido:", e);
        }
    };

    // Función para obtener la posición del mouse en el canvas
    var getMousePosition = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    // Función para manejar el click en el canvas
    var handleCanvasClick = function(evt) {
        var mousePos = getMousePosition(canvas, evt);
        var point = new Point(mousePos.x, mousePos.y);

        // Dibujar el punto localmente
        drawPoint(point);

        // Publicar el punto
        if (stompClient) {
            stompClient.send("/topic/newpoint", {}, JSON.stringify(point));
        }
    };

    var connectAndSubscribe = function() {
        console.info('Conectando a WebSocket...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function(frame) {
            console.log('Conectado: ' + frame);
            stompClient.subscribe('/topic/newpoint', handleReceivedPoint);
        }, function(error) {
            console.error('Error de conexión:', error);
        });
    };

    return {
        init: function() {
            // Configurar canvas
            canvas = document.getElementById('canvas');
            ctx = canvas.getContext('2d');

            // Limpiar canvas
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Evento de click en el canvas
            canvas.addEventListener('click', handleCanvasClick);

            // Conectar a WebSocket
            connectAndSubscribe();
        },

        disconnect: function() {
            if (stompClient !== null) {
                stompClient.disconnect();
                console.log("Desconectado");
            }
        }
    };
})();