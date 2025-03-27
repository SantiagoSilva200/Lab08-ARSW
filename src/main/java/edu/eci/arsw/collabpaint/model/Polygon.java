package edu.eci.arsw.collabpaint.model;

import java.util.ArrayList;
import java.util.List;

public class Polygon {
    private List<Point> points;

    public Polygon() {
        this.points = new ArrayList<>();
    }

    public Polygon(List<Point> points) {
        this.points = new ArrayList<>(points);
    }

    // Método para agregar un punto al polígono
    public void addPoint(Point point) {
        points.add(point);
    }

    // Método para verificar si el polígono es válido (mínimo 3 puntos)
    public boolean isValid() {
        return points != null && points.size() >= 3;
    }

    // Getters y Setters
    public List<Point> getPoints() {
        return points;
    }

    public void setPoints(List<Point> points) {
        this.points = points;
    }

    @Override
    public String toString() {
        return "Polygon{points=" + points + "}";
    }
}
