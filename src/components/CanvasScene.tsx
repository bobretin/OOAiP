import { useEffect, useRef, useState } from "react";
import { LineAlg, RasterRenderer } from "../lib/raster/RasterRenderer";
import { Rect } from "../lib/shapes/Rect";
import { Line } from "../lib/shapes/Line";
import { Oval } from "../lib/shapes/Oval";
import { Triangle } from "../lib/shapes/Triangle";
import { QuadraticBezier } from "../lib/shapes/QuadraticBezier";
import { CubicBezier } from "../lib/shapes/CubicBezier";
import { PathBezier } from "../lib/shapes/PathBezier";

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export default function CanvasScene({ lineAlg }: CanvasSceneProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    // Масштабирование и панорамирование
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Храним фигуры и их оригинальные координаты
    const shapesRef = useRef<any[]>([]);
    const originalTransformsRef = useRef<{ x: number; y: number; scaleX: number; scaleY: number }[]>([]);
    const initializedRef = useRef(false);

    // Функция для обновления трансформаций всех фигур с учетом зума и оффсета
    const updateShapesTransform = () => {
        for (let i = 0; i < shapesRef.current.length; i++) {
            const shape = shapesRef.current[i];
            const original = originalTransformsRef.current[i];
            if (shape && original) {
                // Применяем зум к позиции и масштабу
                shape.transform.x = original.x * zoom + offset.x;
                shape.transform.y = original.y * zoom + offset.y;
                shape.transform.scaleX = original.scaleX * zoom;
                shape.transform.scaleY = original.scaleY * zoom;
            }
        }
    };

    // Обработчики для масштабирования и панорамирования
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
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

    // Обновление трансформаций при изменении зума или оффсета
    useEffect(() => {
        if (shapesRef.current.length > 0) {
            updateShapesTransform();
        }
    }, [zoom, offset]);

    // Обновление алгоритма линий
    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    // Инициализация фигур (один раз)
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const rect = new Rect(200, 100);
        rect.transform.x = 400;
        rect.transform.y = 300;
        rect.transform.rotation = Math.PI / 6;
        rect.fillStyle = "#0088ff";
        rect.fillOpacity = 0.8;
        rect.strokeStyle = "#000000";
        rect.strokeWidth = 2;

        const line = new Line(0, 0, 300, 0);
        line.transform.x = 100;
        line.transform.y = 500;
        line.transform.rotation = -Math.PI / 4;
        line.strokeStyle = "#00ff00";
        line.strokeWidth = 5;

        const oval = new Oval(80, 50);
        oval.transform.x = 700;
        oval.transform.y = 200;
        oval.fillStyle = "#ff0000";
        oval.fillOpacity = 0.5;
        oval.strokeStyle = "#ffffff";
        oval.strokeWidth = 2;

        // Новая фигура: Triangle
        const triangle = Triangle.fromWidthHeight(150, 120);
        triangle.transform.x = 200;
        triangle.transform.y = 200;
        triangle.transform.rotation = Math.PI / 8;
        triangle.fillStyle = "#00ffaa";
        triangle.fillOpacity = 0.7;
        triangle.strokeStyle = "#ffffff";
        triangle.strokeWidth = 3;

        // QuadraticBezier: Параболическая дуга
        const quadBezier1 = new QuadraticBezier(100, 400, 250, 100, 400, 400);
        quadBezier1.transform.x = 0;
        quadBezier1.transform.y = 0;
        quadBezier1.strokeStyle = "#ffaa00";
        quadBezier1.strokeWidth = 4;
        quadBezier1.strokeOpacity = 1;
        quadBezier1.fillOpacity = 0; // Без заполнения

        // CubicBezier: S-образная кривая
        const cubicBezier1 = new CubicBezier(500, 400, 550, 100, 650, 700, 700, 400);
        cubicBezier1.transform.x = 0;
        cubicBezier1.transform.y = 0;
        cubicBezier1.strokeStyle = "#ff00ff";
        cubicBezier1.strokeWidth = 4;
        cubicBezier1.strokeOpacity = 1;
        cubicBezier1.fillOpacity = 0; // Без заполнения

        // CubicBezier: Петля
        const cubicBezier2 = new CubicBezier(800, 400, 950, 200, 650, 600, 800, 500);
        cubicBezier2.transform.x = 0;
        cubicBezier2.transform.y = 0;
        cubicBezier2.strokeStyle = "#00aaff";
        cubicBezier2.strokeWidth = 4;
        cubicBezier2.strokeOpacity = 1;
        cubicBezier2.fillOpacity = 0; // Без заполнения

        // PathBezier: Polyline (открытая ломаная)
        const polyline = new PathBezier('polyline', false);
        polyline.addPointLocal(100, 200);
        polyline.addPointLocal(200, 150);
        polyline.addPointLocal(300, 220);
        polyline.addPointLocal(400, 180);
        polyline.addPointLocal(500, 250);
        polyline.strokeStyle = "#00ff00";
        polyline.strokeWidth = 3;
        polyline.strokeOpacity = 1;
        polyline.fillOpacity = 0; // Без заполнения

        //PathBezier: Closed Polyline (замкнутый многоугольник)
        const closedPoly = new PathBezier('polyline', true);
        closedPoly.addPointLocal(650, 150);
        closedPoly.addPointLocal(750, 100);
        closedPoly.addPointLocal(850, 150);
        closedPoly.addPointLocal(800, 250);
        closedPoly.addPointLocal(700, 250);
        closedPoly.fillStyle = "#aa00ff";
        closedPoly.fillOpacity = 0.6;
        closedPoly.strokeStyle = "#ffffff";
        closedPoly.strokeWidth = 2;

        // PathBezier: Bezier mode (кубические сегменты)
        const bezierPath = new PathBezier('catmull', false);
        // Первый сегмент (4 точки: p0, p1, p2, p3)
        bezierPath.addPointLocal(100, 350);
        bezierPath.addPointLocal(200, 300);
        bezierPath.addPointLocal(300, 400);
        bezierPath.addPointLocal(400, 350);
        bezierPath.strokeStyle = "#ff0000";
        bezierPath.strokeWidth = 3;
        bezierPath.strokeOpacity = 1;
        bezierPath.fillOpacity = 0; // Без заполнения

        // PathBezier: Catmull-Rom сплайн (открытый)
        const catmullOpen = new PathBezier('catmull', true);
        catmullOpen.addPointLocal(150, 500);
        catmullOpen.addPointLocal(250, 400);
        catmullOpen.addPointLocal(300, 600);
        catmullOpen.addPointLocal(400, 400);
        catmullOpen.strokeStyle = "#e1ff00";
        catmullOpen.strokeWidth = 3;
        catmullOpen.strokeOpacity = 1;
        catmullOpen.fillOpacity = 0; // Без заполнения

        // PathBezier: Catmull-Rom сплайн (замкнутый)
        const catmullClosed = new PathBezier('catmull', true);
        catmullClosed.addPointLocal(650, 500);
        catmullClosed.addPointLocal(750, 450);
        catmullClosed.addPointLocal(850, 500);
        catmullClosed.addPointLocal(900, 600);
        catmullClosed.addPointLocal(800, 650);
        catmullClosed.addPointLocal(700, 600);
        catmullClosed.fillStyle = "#ff0066";
        catmullClosed.fillOpacity = 0.5;
        catmullClosed.strokeStyle = "#ffffff";
        catmullClosed.strokeWidth = 2;

        // Сохраняем все фигуры и их оригинальные трансформации
        shapesRef.current = [
            rect, line, oval,
            triangle,
            quadBezier1,
            cubicBezier1, cubicBezier2,
            polyline, closedPoly, bezierPath, catmullOpen, catmullClosed
        ];

        // Сохраняем оригинальные значения трансформаций
        originalTransformsRef.current = shapesRef.current.map(shape => ({
            x: shape.transform.x,
            y: shape.transform.y,
            scaleX: shape.transform.scaleX,
            scaleY: shape.transform.scaleY
        }));

        // Применяем начальный зум
        updateShapesTransform();
    }, []);

    // Основной цикл рендеринга
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

                // Отрисовка всех фигур
                for (const shape of shapesRef.current) {
                    if (shape && typeof shape.drawRaster === 'function') {
                        shape.drawRaster(r);
                    }
                }

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
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                background: '#1a1a2e',
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
            {/* Индикатор масштаба и координат */}
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
                🔍 {(zoom * 100).toFixed(0)}%
                <span style={{ fontSize: '10px', color: '#aaa', display: 'block' }}>
                    Ctrl+Колесо | Средняя кнопка мыши
                </span>
            </div>
        </div>
    );
}