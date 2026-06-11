import { useEffect, useRef, useState } from "react";
import { LineAlg, RasterRenderer, RGBA } from "../lib/raster/RasterRenderer.ts";

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
        if (e.button === 1) { // Средняя кнопка мыши
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
    
    useEffect(() => 
    {
        if (rendererRef.current) 
        {
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
                r.beginFrame(true); // Очистка буфера
                
                // Синий квадрат
                const blueSquare = [
                    transformPoint(50, 50),
                    transformPoint(250, 50),
                    transformPoint(250, 250),
                    transformPoint(50, 250)
                ];
                const blue: RGBA = { r: 0, g: 100, b: 255, a: 255 };
                r.fillPolygon(blueSquare, blue);
                
                // Красный полупрозрачный круг, частично наложенный на квадрат
                const circleCenter = transformPoint(250, 250);
                const redTransparent: RGBA = { r: 255, g: 0, b: 0, a: 150 };
                r.fillCircle(circleCenter.x, circleCenter.y, 80 * zoom, redTransparent);
                
                // Замкнутая ломаная линия (зелёная)
                const greenLinePoints = [
                    transformPoint(300, 100),
                    transformPoint(400, 300),
                    transformPoint(600, 150),
                    transformPoint(700, 400),
                    transformPoint(300, 100) // Замыкаем линию
                ];
                const green: RGBA = { r: 0, g: 255, b: 100, a: 255 };
                r.strokePolygon(greenLinePoints, green, 10);
                
                r.commit(); // Вывод на экран
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
    }, [zoom, offset]); // Добавляем zoom и offset в зависимости

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                background: '#000', // Черный фон, чтобы видеть прозрачность
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
            {/* Индикатор масштаба */}
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