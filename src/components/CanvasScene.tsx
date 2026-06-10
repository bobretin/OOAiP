import { useEffect, useRef, useState } from "react";
import { LineAlg, RasterRenderer, RGBA } from "../lib/raster/RasterRenderer.ts";
import { Rect, Line, Oval, Triangle, QuadraticBezier, CubicBezier, PathBezier } from "../lib/shapes";

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export default function CanvasScene({ lineAlg }: CanvasSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const transformPoint = (x: number, y: number) => ({
        x: x * zoom + offset.x,
        y: y * zoom + offset.y
    });

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.min(5, Math.max(0.2, zoom + delta));
            setZoom(newZoom);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };
    
    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const ro = new ResizeObserver(() => {
            renderer.resize();
        });

        if (containerRef.current) {
            ro.observe(containerRef.current);
        } else {
            ro.observe(canvas);
        }

        let rafId: number;

        const frame = () => {
            const r = rendererRef.current;
            if (r) {
                r.beginFrame(true);
                
                // Синий квадрат
                const blueSquare = [
                    transformPoint(50, 50),
                    transformPoint(250, 50),
                    transformPoint(250, 250),
                    transformPoint(50, 250)
                ];
                const blue: RGBA = { r: 0, g: 100, b: 255, a: 255 };
                r.fillPolygon(blueSquare, blue);
                
                // Красный полупрозрачный круг
                const circleCenter = transformPoint(250, 250);
                const redTransparent: RGBA = { r: 255, g: 0, b: 0, a: 100 };
                r.fillCircle(circleCenter.x, circleCenter.y, 80 * zoom, redTransparent);
                
                // Замкнутая ломаная линия (зелёная)
                const greenLinePoints = [
                    transformPoint(300, 100),
                    transformPoint(400, 300),
                    transformPoint(600, 150),
                    transformPoint(700, 400),
                    transformPoint(300, 100)
                ];
                const green: RGBA = { r: 0, g: 255, b: 100, a: 255 };
                r.strokePolygon(greenLinePoints, green, 10);
                
                // 1. Прямоугольник (Rect) - используем transformPoint для координат
                const rect = new Rect('rect1', 
                    transformPoint(350, 80).x, 
                    transformPoint(350, 80).y, 
                    100, 60
                );
                rect.fillStyle = '#3b82f6';
                rect.fillOpacity = 0.8;
                rect.strokeStyle = '#ffffff';
                rect.strokeWidth = 2;
                rect.drawRaster(r);
                
                // 2. Линия (Line) - координаты через transformPoint
                const p1 = transformPoint(500, 50);
                const p2 = transformPoint(650, 120);
                const line = new Line('line1', p1.x, p1.y, p2.x, p2.y);
                line.strokeStyle = '#10b981';
                line.strokeWidth = 3;
                line.drawRaster(r);
                
                // 3. Овал (Oval)
                const oval = new Oval('oval1', 
                    transformPoint(700, 150).x, 
                    transformPoint(700, 150).y, 
                    50 * zoom, 30 * zoom
                );
                oval.fillStyle = '#ef4444';
                oval.fillOpacity = 0.6;
                oval.strokeStyle = '#ffffff';
                oval.strokeWidth = 2;
                oval.drawRaster(r);
                
                // 4. Треугольник (Triangle)
                const t1 = transformPoint(100, 350);
                const t2 = transformPoint(200, 350);
                const t3 = transformPoint(150, 450);
                const triangle = new Triangle('tri1', t1.x, t1.y, t2.x, t2.y, t3.x, t3.y);
                triangle.fillStyle = '#f59e0b';
                triangle.fillOpacity = 0.8;
                triangle.strokeStyle = '#ffffff';
                triangle.strokeWidth = 2;
                triangle.drawRaster(r);
                
                // ========== 5. Квадратичная кривая Безье (QuadraticBezier) - базовое состояние, 3 точки ==========
                // Первая кривая: слева внизу
                const quadStart1 = transformPoint(250, 400);
                const quadControl1 = transformPoint(350, 300);
                const quadEnd1 = transformPoint(450, 430);
                const quadraticBezier1 = new QuadraticBezier('quad1', quadStart1.x, quadStart1.y, quadControl1.x, quadControl1.y, quadEnd1.x, quadEnd1.y);
                quadraticBezier1.strokeStyle = '#ec4899';
                quadraticBezier1.strokeWidth = 3;
                quadraticBezier1.drawRaster(r);
                
                // Вторая квадратичная кривая для наглядности (с другим направлением)
                const quadStart2 = transformPoint(250, 450);
                const quadControl2 = transformPoint(350, 520);
                const quadEnd2 = transformPoint(450, 460);
                const quadraticBezier2 = new QuadraticBezier('quad2', quadStart2.x, quadStart2.y, quadControl2.x, quadControl2.y, quadEnd2.x, quadEnd2.y);
                quadraticBezier2.strokeStyle = '#f43f5e';
                quadraticBezier2.strokeWidth = 2.5;
                quadraticBezier2.drawRaster(r);
                
                // ========== 6. Кубическая кривая Безье (CubicBezier) - базовое состояние, 4 точки ==========
                // Первая кубическая кривая
                const cubicStart1 = transformPoint(500, 380);
                const cubicControl1_1 = transformPoint(550, 300);
                const cubicControl1_2 = transformPoint(650, 450);
                const cubicEnd1 = transformPoint(750, 380);
                const cubicBezier1 = new CubicBezier('cubic1', cubicStart1.x, cubicStart1.y, cubicControl1_1.x, cubicControl1_1.y, cubicControl1_2.x, cubicControl1_2.y, cubicEnd1.x, cubicEnd1.y);
                cubicBezier1.strokeStyle = '#06b6d4';
                cubicBezier1.strokeWidth = 3;
                cubicBezier1.drawRaster(r);
                
                // Вторая кубическая кривая (волнообразная)
                const cubicStart2 = transformPoint(520, 470);
                const cubicControl2_1 = transformPoint(580, 520);
                const cubicControl2_2 = transformPoint(620, 400);
                const cubicEnd2 = transformPoint(720, 470);
                const cubicBezier2 = new CubicBezier('cubic2', cubicStart2.x, cubicStart2.y, cubicControl2_1.x, cubicControl2_1.y, cubicControl2_2.x, cubicControl2_2.y, cubicEnd2.x, cubicEnd2.y);
                cubicBezier2.strokeStyle = '#22d3ee';
                cubicBezier2.strokeWidth = 2.5;
                cubicBezier2.drawRaster(r);
                
                // ========== 7. PathBezier - с параметром closed = true, с добавленными дополнительными опорными точками ==========
                // Создаем замкнутую кривую Безье с дополнительными опорными точками для сложной формы
                // Координаты точек: начальная точка + опорные точки
                const pathPoints = [
                    transformPoint(900, 150),  // P0 - начальная точка
                    transformPoint(980, 100),  // P1 - опорная 1
                    transformPoint(1050, 150), // P2 - опорная 2
                    transformPoint(1100, 200), // P3 - опорная 3
                    transformPoint(1150, 280), // P4 - опорная 4
                    transformPoint(1100, 360), // P5 - опорная 5
                    transformPoint(1000, 380), // P6 - опорная 6
                    transformPoint(900, 340),  // P7 - опорная 7
                    transformPoint(850, 260),  // P8 - опорная 8
                    transformPoint(880, 200)   // P9 - опорная 9 (последняя)
                ];
                
                // Создаем PathBezier с closed = true
                const pathBezier = new PathBezier('path1', pathPoints, 'polyline');
                pathBezier.setClosed(true);
                pathBezier.strokeStyle = '#fbbf24';  // Золотистый цвет
                pathBezier.fillStyle = '#f59e0b';
                pathBezier.fillOpacity = 0.3;        // Полупрозрачная заливка
                pathBezier.strokeWidth = 3;
                pathBezier.drawRaster(r);
                
                // Дополнительная замкнутая кривая Безье в другом месте для демонстрации
                const pathPoints2 = [
                    transformPoint(800, 450),  // P0
                    transformPoint(880, 420),  // P1
                    transformPoint(950, 460),  // P2
                    transformPoint(980, 520),  // P3
                    transformPoint(930, 580),  // P4
                    transformPoint(850, 560),  // P5
                    transformPoint(810, 510)   // P6
                ];
                
                const pathBezier2 = new PathBezier('path2', pathPoints2, 'polyline');
                pathBezier.setClosed(true);
                pathBezier2.strokeStyle = '#a855f7';  // Фиолетовый цвет
                pathBezier2.fillStyle = '#7c3aed';
                pathBezier2.fillOpacity = 0.25;
                pathBezier2.strokeWidth = 3;
                pathBezier2.drawRaster(r);
                
                // Рисуем вспомогательные точки для наглядности (опорные точки PathBezier)
                const pointColor: RGBA = { r: 255, g: 200, b: 100, a: 200 };
                pathPoints.forEach(point => {
                    r.fillCircle(point.x, point.y, 3 * zoom, pointColor);
                });
                pathPoints2.forEach(point => {
                    r.fillCircle(point.x, point.y, 3 * zoom, { r: 200, g: 150, b: 255, a: 200 });
                });
                
                // Вспомогательные точки для квадратичных и кубических кривых
                const controlPointColor: RGBA = { r: 255, g: 100, b: 100, a: 150 };
                r.fillCircle(quadControl1.x, quadControl1.y, 4 * zoom, controlPointColor);
                r.fillCircle(cubicControl1_1.x, cubicControl1_1.y, 4 * zoom, controlPointColor);
                r.fillCircle(cubicControl1_2.x, cubicControl1_2.y, 4 * zoom, controlPointColor);
                
                r.commit();
            }
            rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [zoom, offset, lineAlg]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                background: '#000',
                position: 'relative',
                overflow: 'hidden'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    cursor: isPanning ? 'grabbing' : 'grab'
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                pointerEvents: 'none',
                zIndex: 10
            }}>
                🔍 {(zoom * 100).toFixed(0)}% | {lineAlg === 'bresenham' ? 'Брезенхем' : 'Ву'}
                <span style={{ fontSize: '10px', color: '#aaa', display: 'block' }}>
                    Ctrl+Колесо | Средняя кнопка мыши
                </span>
            </div>
        </div>
    );
}