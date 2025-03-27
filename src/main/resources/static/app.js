var app = (function () {
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    // Variables de estado
    var stompClient = null;
    var canvas = null;
    var ctx = null;
    var currentTopic = null;
    var isConnected = false;

    // Elementos del DOM
    var drawingIdInput = null;
    var connectBtn = null;
    var disconnectBtn = null;
    var statusLabel = null;

    // Función para dibujar un punto en el canvas
    var drawPoint = function(point, color = '#0000FF') {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    };

    // Función para dibujar un polígono
    // En la función de dibujo de polígonos
    var drawPolygon = function(polygon) {
        if (!polygon.points || polygon.points.length < 4) {
            console.log("Se recibió un polígono con menos de 4 puntos");
            return;
        }

        ctx.beginPath();
        ctx.moveTo(polygon.points[0].x, polygon.points[0].y);

        for (var i = 1; i < polygon.points.length; i++) {
            ctx.lineTo(polygon.points[i].x, polygon.points[i].y);
        }

        ctx.closePath();
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Relleno con color diferente para distinguir polígonos de 4 lados
        ctx.fillStyle = 'rgba(255, 255, 255, 0.0)'; // Verde semi-transparente
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

    // Función para manejar los polígonos recibidos
    var handleReceivedPolygon = function(message) {
        try {
            var polygon = JSON.parse(message.body);
            drawPolygon(polygon);
        } catch (e) {
            console.error("Error al procesar polígono recibido:", e);
        }
    };

    // Función para obtener la posición del mouse en el canvas
    var getMousePosition = function(evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    // Función para manejar el click en el canvas
    var handleCanvasClick = function(evt) {
        if (!isConnected) return;

        var mousePos = getMousePosition(evt);
        var point = new Point(mousePos.x, mousePos.y);

        // Dibujar el punto localmente (en verde para distinguirlo)
        drawPoint(point, '#00AA00');

        // Publicar el punto al endpoint del servidor
        stompClient.send("/app/newpoint." + currentTopic, {}, JSON.stringify(point));
    };

    // Función para actualizar la interfaz según el estado de conexión
    var updateUI = function() {
        if (isConnected) {
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            drawingIdInput.disabled = true;
            statusLabel.textContent = `Conectado al dibujo #${currentTopic}`;
            statusLabel.style.color = 'green';
        } else {
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            drawingIdInput.disabled = false;
            statusLabel.textContent = 'No conectado';
            statusLabel.style.color = 'red';
        }
    };

    // Función para limpiar el canvas
    var clearCanvas = function() {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    return {
        init: function() {
            // Configurar elementos del DOM
            canvas = document.getElementById('canvas');
            ctx = canvas.getContext('2d');
            drawingIdInput = document.getElementById('drawingId');
            connectBtn = document.getElementById('connectBtn');
            disconnectBtn = document.getElementById('disconnectBtn');
            statusLabel = document.getElementById('connectionStatus');

            // Limpiar canvas
            clearCanvas();

            // Evento de click en el canvas
            canvas.addEventListener('click', handleCanvasClick);

            // Inicializar UI
            updateUI();
        },

        connect: function() {
            var drawingId = drawingIdInput.value;

            if (!drawingId || isNaN(drawingId) || parseInt(drawingId) <= 0) {
                alert("Por favor ingrese un ID de dibujo válido (número positivo)");
                return;
            }

            currentTopic = drawingId;

            // Conectar a WebSocket
            console.info('Conectando a WebSocket...');
            var socket = new SockJS('/stompendpoint');
            stompClient = Stomp.over(socket);

            stompClient.connect({}, function(frame) {
                console.log('Conectado: ' + frame);

                // Suscribirse a los tópicos específicos
                var pointTopic = '/topic/newpoint.' + currentTopic;
                var polygonTopic = '/topic/newpolygon.' + currentTopic;

                stompClient.subscribe(pointTopic, handleReceivedPoint);
                stompClient.subscribe(polygonTopic, handleReceivedPolygon);

                isConnected = true;
                updateUI();
                clearCanvas();

                console.log(`Suscrito a los tópicos: ${pointTopic} y ${polygonTopic}`);
            }, function(error) {
                console.error('Error de conexión:', error);
                alert("Error al conectar al servidor");
            });
        },

        disconnect: function() {
            if (stompClient !== null) {
                stompClient.disconnect();
                stompClient = null;
                console.log("Desconectado");
            }

            isConnected = false;
            currentTopic = null;
            updateUI();
            clearCanvas();
        }
    };
})();