import { describe, test, expect } from 'vitest';
import { Rect, Line, Oval } from './index';

describe('Rect', () => {
    test('hitTest - точка внутри прямоугольника', () => {
        // Прямоугольник с центром в (100, 100), шириной 80, высотой 40
        // Границы: X от 60 до 140, Y от 80 до 120
        const rect = new Rect('test1', 100, 100, 80, 40);
        
        // Центр - внутри
        expect(rect.hitTest(100, 100)).toBe(true);
        
        // Внутри (правая верхняя четверть)
        expect(rect.hitTest(130, 90)).toBe(true);
        
        // Слева от прямоугольника (x < 60) - должно быть false
        expect(rect.hitTest(50, 100)).toBe(false);
        
        // Сверху от прямоугольника (y < 80) - должно быть false
        expect(rect.hitTest(100, 70)).toBe(false);
        
        // Справа от прямоугольника (x > 140) - должно быть false
        expect(rect.hitTest(150, 100)).toBe(false);
        
        // Снизу от прямоугольника (y > 120) - должно быть false
        expect(rect.hitTest(100, 130)).toBe(false);
    });

    test('getBounds - границы прямоугольника', () => {
        const rect = new Rect('test2', 100, 100, 80, 40);
        const bounds = rect.getBounds();
        
        // Границы должны соответствовать центру (100,100) и размеру (80,40)
        expect(bounds.minX).toBeCloseTo(60);
        expect(bounds.maxX).toBeCloseTo(140);
        expect(bounds.minY).toBeCloseTo(80);
        expect(bounds.maxY).toBeCloseTo(120);
    });
});

describe('Line', () => {
    test('hitTest - точка на линии', () => {
        // Линия от (0,0) до (100,0) с центром в (50,0)
        const line = new Line('test3', 0, 0, 100, 0);
        
        // Точка на линии
        expect(line.hitTest(50, 0)).toBe(true);
        expect(line.hitTest(0, 0)).toBe(true);
        expect(line.hitTest(100, 0)).toBe(true);
        
        // Точка близко к линии (расстояние 2 пикселя)
        expect(line.hitTest(50, 2)).toBe(true);
        
        // Точка далеко от линии
        expect(line.hitTest(50, 10)).toBe(false);
    });
});

describe('Oval', () => {
    test('hitTest - точка внутри овала', () => {
        // Овал с центром в (100, 100), радиус X=50, радиус Y=30
        const oval = new Oval('test4', 100, 100, 50, 30);
        
        // Центр - внутри
        expect(oval.hitTest(100, 100)).toBe(true);
        
        // Внутри по X (на границе)
        expect(oval.hitTest(150, 100)).toBe(true);
        
        // Внутри по Y (на границе)
        expect(oval.hitTest(100, 130)).toBe(true);
        
        // Снаружи
        expect(oval.hitTest(160, 100)).toBe(false);
        expect(oval.hitTest(100, 140)).toBe(false);
        expect(oval.hitTest(50, 100)).toBe(true);  // левая граница - внутри
    });

    test('getBounds - границы овала', () => {
        const oval = new Oval('test5', 100, 100, 50, 30);
        const bounds = oval.getBounds();
        
        expect(bounds.minX).toBeCloseTo(50);
        expect(bounds.maxX).toBeCloseTo(150);
        expect(bounds.minY).toBeCloseTo(70);
        expect(bounds.maxY).toBeCloseTo(130);
    });
});