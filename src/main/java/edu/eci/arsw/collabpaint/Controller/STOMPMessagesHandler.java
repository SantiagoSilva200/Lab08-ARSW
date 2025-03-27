package edu.eci.arsw.collabpaint.Controller;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    private SimpMessagingTemplate msgt;

    // Mapa concurrente para mantener los puntos por dibujo
    private final ConcurrentMap<String, List<Point>> drawingPoints = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) {
        System.out.println("Punto recibido para dibujo " + numdibujo + ": " + pt);

        // 1. Reenviar el punto a los clientes
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        // 2. Manejar la colección de puntos para polígonos
        synchronized (drawingPoints) {
            List<Point> points = drawingPoints.computeIfAbsent(numdibujo, k -> new ArrayList<>());
            points.add(pt);

            // Cambio: Ahora requerimos 4 puntos para formar un polígono
            if (points.size() >= 4) {
                Polygon polygon = new Polygon(new ArrayList<>(points));
                System.out.println("Enviando polígono para dibujo " + numdibujo + ": " + polygon);
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
                points.clear();
            }
        }
    }
}
