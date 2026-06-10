import { describe, test, expect } from 'vitest';
import { QuadraticBezier, CubicBezier, PathBezier, Triangle } from './index';

describe('Triangle', () => {
    test('hitTest - точка внутри треугольника', () => {
        const triangle = new Triangle('test1', 0, 0, 100, 0, 50, 100);
        
        expect(triangle.hitTest(50, 33)).toBe(true);
        expect(triangle.hitTest(0, 0)).toBe(true);
        expect(triangle.hitTest(100, 0)).toBe(true);
        expect(triangle.hitTest(50, 100)).toBe(true);
        expect(triangle.hitTest(-10, 0)).toBe(false);
        expect(triangle.hitTest(50, -10)).toBe(false);
        expect(triangle.hitTest(50, 150)).toBe(false);
    });

    test('getBounds - границы треугольника', () => {
        const triangle = new Triangle('test2', 0, 0, 100, 0, 50, 100);
        const bounds = triangle.getBounds();
        
        expect(bounds.minX).toBeCloseTo(0);
        expect(bounds.maxX).toBeCloseTo(100);
        expect(bounds.minY).toBeCloseTo(0);
        expect(bounds.maxY).toBeCloseTo(100);
    });
});

describe('QuadraticBezier', () => {
    test('evalLocal - вычисление точки на кривой', () => {
        const curve = new QuadraticBezier('test1', 0, 0, 50, 100, 100, 0);
        
        // Точки в локальных координатах (относительно центра)
        // Центр фигуры: x=50, y=50
        // Начальная точка (0,0) в локальных координатах = (-50, -50)
        const p0 = curve.evalLocal(0);
        expect(p0.x).toBeCloseTo(-50);  // 0 - 50 = -50
        expect(p0.y).toBeCloseTo(-50);  // 0 - 50 = -50
        
        // Конечная точка (100,0) в локальных координатах = (50, -50)
        const p1 = curve.evalLocal(1);
        expect(p1.x).toBeCloseTo(50);   // 100 - 50 = 50
        expect(p1.y).toBeCloseTo(-50);  // 0 - 50 = -50
        
        // Середина кривой в локальных координатах
        const pMid = curve.evalLocal(0.5);
        expect(pMid.x).toBeCloseTo(0);   // 50 - 50 = 0
        expect(pMid.y).toBeCloseTo(0);   // 50 - 50 = 0
    });

    test('hitTest - точка на кривой', () => {
        const curve = new QuadraticBezier('test2', 0, 0, 50, 100, 100, 0);
        
        // Проверяем в глобальных координатах
        expect(curve.hitTest(0, 0)).toBe(true);
        expect(curve.hitTest(100, 0)).toBe(true);
        expect(curve.hitTest(50, 50)).toBe(true);
        expect(curve.hitTest(50, 55)).toBe(true);
        expect(curve.hitTest(50, 80)).toBe(false);
    });

    test('getBounds - границы кривой', () => {
        const curve = new QuadraticBezier('test3', 0, 0, 50, 100, 100, 0);
        const bounds = curve.getBounds();
        
        expect(bounds.minX).toBeCloseTo(0);
        expect(bounds.maxX).toBeCloseTo(100);
        expect(bounds.minY).toBeCloseTo(0);
        expect(bounds.maxY).toBeCloseTo(50);
    });

    test('getControlPoints и setControlPoint', () => {
        const curve = new QuadraticBezier('test4', 0, 0, 50, 100, 100, 0);
        const points = curve.getControlPoints();
        
        expect(points[0].x).toBeCloseTo(0);
        expect(points[0].y).toBeCloseTo(0);
        expect(points[1].x).toBeCloseTo(50);
        expect(points[1].y).toBeCloseTo(100);
        expect(points[2].x).toBeCloseTo(100);
        expect(points[2].y).toBeCloseTo(0);
        
        curve.setControlPoint(1, 60, 120);
        const newPoints = curve.getControlPoints();
        expect(newPoints[1].x).toBeCloseTo(60);
        expect(newPoints[1].y).toBeCloseTo(120);
    });
});

describe('CubicBezier', () => {
    test('evalLocal - вычисление точки на кривой', () => {
        const curve = new CubicBezier('test1', 0, 0, 50, 100, 50, 100, 100, 0);
        
        // Центр фигуры: x=50, y=50
        // Начальная точка (0,0) в локальных координатах = (-50, -50)
        const p0 = curve.evalLocal(0);
        expect(p0.x).toBeCloseTo(-50);
        expect(p0.y).toBeCloseTo(-50);
        
        // Конечная точка (100,0) в локальных координатах = (50, -50)
        const p1 = curve.evalLocal(1);
        expect(p1.x).toBeCloseTo(50);
        expect(p1.y).toBeCloseTo(-50);
    });

    test('hitTest - точка на кривой', () => {
        const curve = new CubicBezier('test2', 0, 0, 50, 100, 50, 100, 100, 0);
        
        expect(curve.hitTest(0, 0)).toBe(true);
        expect(curve.hitTest(100, 0)).toBe(true);
    });

    test('getBounds - границы кривой', () => {
        const curve = new CubicBezier('test3', 0, 0, 50, 100, 50, 100, 100, 0);
        const bounds = curve.getBounds();
        
        expect(bounds.minX).toBeCloseTo(0);
        expect(bounds.maxX).toBeCloseTo(100);
    });

    test('getControlPoints и setControlPoint', () => {
        const curve = new CubicBezier('test4', 0, 0, 50, 100, 50, 100, 100, 0);
        const points = curve.getControlPoints();
        
        expect(points.length).toBe(4);
        expect(points[0].x).toBeCloseTo(0);
        expect(points[3].x).toBeCloseTo(100);
        
        curve.setControlPoint(1, 60, 120);
        const newPoints = curve.getControlPoints();
        expect(newPoints[1].x).toBeCloseTo(60);
        expect(newPoints[1].y).toBeCloseTo(120);
    });
});

describe('PathBezier', () => {
    test('polyline режим - точки соединяются отрезками', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 }
        ];
        const path = new PathBezier('test1', points, 'polyline');
        
        expect(path.hitTest(0, 0)).toBe(true);
        expect(path.hitTest(50, 0)).toBe(true);
        expect(path.hitTest(100, 50)).toBe(true);
        expect(path.hitTest(50, 50)).toBe(false);
    });

    test('замкнутый путь', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 }
        ];
        const path = new PathBezier('test2', points, 'polyline', true);
        
        expect(path.hitTest(50, 50)).toBe(true);
    });

    test('добавление и удаление точек', () => {
        const path = new PathBezier('test3', [], 'polyline');
        expect(path.getControlPoints().length).toBe(0);
        
        path.addPoint(0, 0);
        path.addPoint(100, 0);
        expect(path.getControlPoints().length).toBe(2);
        
        path.removePoint(0);
        expect(path.getControlPoints().length).toBe(1);
    });

    test('getBounds - границы пути', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        ];
        const path = new PathBezier('test4', points, 'polyline');
        const bounds = path.getBounds();
        
        expect(bounds.minX).toBeCloseTo(0);
        expect(bounds.maxX).toBeCloseTo(100);
        expect(bounds.minY).toBeCloseTo(0);
        expect(bounds.maxY).toBeCloseTo(100);
    });

    test('смена режима', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 }
        ];
        const path = new PathBezier('test5', points, 'polyline');
        
        expect(path.getControlPoints().length).toBe(3);
        
        path.setMode('bezier');
        expect(path.getControlPoints().length).toBe(3);
    });

    test('toJSON и clone', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 }
        ];
        const path = new PathBezier('test6', points, 'polyline', true);
        path.strokeWidth = 5;
        path.strokeStyle = '#ff0000';
        
        const json = path.toJSON();
        expect(json).toHaveProperty('type', 'path');
        expect(json).toHaveProperty('strokeWidth', 5);
        
        const cloned = path.clone();
        expect(cloned.id).toBe('test6');
        expect(cloned.strokeWidth).toBe(5);
        expect(cloned.getControlPoints().length).toBe(3);
    });
});