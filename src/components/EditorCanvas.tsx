import { useCallback, useEffect, useRef, useState } from "react";
import { RasterRenderer } from "../lib/raster/RasterRenderer";
import { Shape } from "../lib/shapes/Shape";
import { Rect } from "../lib/shapes/Rect";
import { Oval } from "../lib/shapes/Oval";
import { PathBezier } from "../lib/shapes/PathBezier";
import { Triangle } from "../lib/shapes/Triangle";
import { Line } from "../lib/shapes/Line";
import { QuadraticBezier } from "../lib/shapes/QuadraticBezier";
import { CubicBezier } from "../lib/shapes/CubicBezier";
import { Point2D } from "../lib/math/mat3";

type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | null;

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 40;
const MIN_SIZE = 10;

export default function EditorCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const isMountedRef = useRef(true);
    const needsRenderRef = useRef(true);
    
    // Состояние только для UI (список слоёв, выделение)
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    
    // Refs для логики (чтобы не зависеть от рендеров React)
    const shapesRef = useRef<Shape[]>([]);
    const selectedIdRef = useRef<number | null>(null);
    
    // Ref для функции отрисовки выделения (чтобы рендерцикл не зависел от неё)
    const drawSelectionUIRef = useRef<(renderer: RasterRenderer, shape: Shape) => void>(() => {});
    
    // Синхронизация state -> ref
    useEffect(() => {
        shapesRef.current = shapes;
        needsRenderRef.current = true;
    }, [shapes]);
    
    useEffect(() => {
        selectedIdRef.current = selectedId;
        needsRenderRef.current = true;
    }, [selectedId]);
    
    // ========== ИНИЦИАЛИЗАЦИЯ ФИГУР ==========
    useEffect(() => {
        const newShapes: Shape[] = [];
        
        const rect = new Rect(200, 100);
        rect.transform.x = 400; rect.transform.y = 300; rect.transform.rotation = Math.PI / 6;
        rect.fillStyle = "#0088ff"; rect.fillOpacity = 0.8; rect.strokeStyle = "#000000"; rect.strokeWidth = 2;
        newShapes.push(rect);
        
        const line = new Line(0, 0, 300, 0);
        line.transform.x = 100; line.transform.y = 500; line.transform.rotation = -Math.PI / 4;
        line.strokeStyle = "#00ff00"; line.strokeWidth = 5;
        newShapes.push(line);
        
        const oval = new Oval(80, 50);
        oval.transform.x = 700; oval.transform.y = 200;
        oval.fillStyle = "#ff0000"; oval.fillOpacity = 0.5; oval.strokeStyle = "#ffffff"; oval.strokeWidth = 2;
        newShapes.push(oval);
        
        const triangle = Triangle.fromWidthHeight(150, 120);
        triangle.transform.x = 250; triangle.transform.y = 200; triangle.transform.rotation = Math.PI / 8;
        triangle.fillStyle = "#00ffaa"; triangle.fillOpacity = 0.7; triangle.strokeStyle = "#ffffff"; triangle.strokeWidth = 3;
        newShapes.push(triangle);
        
        const quadBezier = new QuadraticBezier(100, 500, 250, 300, 400, 500);
        quadBezier.strokeStyle = "#ffaa00"; quadBezier.strokeWidth = 4; quadBezier.fillOpacity = 0;
        newShapes.push(quadBezier);
        
        const cubicBezier = new CubicBezier(500, 450, 550, 200, 650, 600, 750, 450);
        cubicBezier.strokeStyle = "#ff00ff"; cubicBezier.strokeWidth = 4; cubicBezier.fillOpacity = 0;
        newShapes.push(cubicBezier);
        
        const catmullPath = new PathBezier('catmull', false);
        catmullPath.addPointLocal(600, 250); catmullPath.addPointLocal(700, 200);
        catmullPath.addPointLocal(800, 300); catmullPath.addPointLocal(900, 250);
        catmullPath.strokeStyle = "#ffff00"; catmullPath.strokeWidth = 3; catmullPath.fillOpacity = 0;
        newShapes.push(catmullPath);
        
        setShapes(newShapes);
    }, []);
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    const getCanvasCoords = useCallback((clientX: number, clientY: number): Point2D => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }, []);
    
    const getShapeAtPoint = useCallback((px: number, py: number): Shape | null => {
        const currentShapes = shapesRef.current;
        for (let i = currentShapes.length - 1; i >= 0; i--) {
            if (currentShapes[i].hitTest(px, py)) return currentShapes[i];
        }
        return null;
    }, []);
    
    const getShapeCorners = useCallback((shape: Shape): Point2D[] | null => {
        const bounds = shape.getBounds();
        if (!bounds) return null;
        return [
            { x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.maxY }, { x: bounds.minX, y: bounds.maxY },
        ];
    }, []);
    
    const getHandleAtPoint = useCallback((shape: Shape, px: number, py: number): ResizeHandle | 'rotate' | null => {
        const bounds = shape.getBounds();
        if (!bounds) return null;
        const corners = getShapeCorners(shape);
        if (!corners) return null;
        
        const handles: [ResizeHandle, Point2D][] = [
            ['nw', corners[0]], ['ne', corners[1]], ['se', corners[2]], ['sw', corners[3]],
        ];
        
        for (const [handle, pos] of handles) {
            if (Math.hypot(px - pos.x, py - pos.y) <= HANDLE_SIZE) return handle;
        }
        
        const center = { x: bounds.centerX, y: bounds.centerY };
        const topCenter = { x: bounds.centerX, y: bounds.minY };
        const dir = Math.atan2(topCenter.y - center.y, topCenter.x - center.x);
        const rotX = center.x + Math.cos(dir) * ROTATION_HANDLE_DISTANCE;
        const rotY = center.y + Math.sin(dir) * ROTATION_HANDLE_DISTANCE;
        if (Math.hypot(px - rotX, py - rotY) <= HANDLE_SIZE) return 'rotate';
        
        return null;
    }, [getShapeCorners]);
    
    // ========== ЛОГИКА УДАЛЕНИЯ И СЛОЁВ ==========
    const deleteSelected = useCallback(() => {
        if (selectedIdRef.current === null) return;
        const idToDelete = selectedIdRef.current;
        setShapes(prev => prev.filter(s => s.id !== idToDelete));
        setSelectedId(null);
    }, []);
    
    const moveUp = useCallback((id: number) => {
        setShapes(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx === -1 || idx === prev.length - 1) return prev;
            const newShapes = [...prev];
            [newShapes[idx], newShapes[idx + 1]] = [newShapes[idx + 1], newShapes[idx]];
            return newShapes;
        });
    }, []);
    
    const moveDown = useCallback((id: number) => {
        setShapes(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx === -1 || idx === 0) return prev;
            const newShapes = [...prev];
            [newShapes[idx], newShapes[idx - 1]] = [newShapes[idx - 1], newShapes[idx]];
            return newShapes;
        });
    }, []);
    
    // ========== СОСТОЯНИЕ ДРАГА ==========
    const dragStateRef = useRef<{
        active: boolean;
        type: 'move' | 'resize' | 'rotate';
        handle: ResizeHandle | null;
        startPoint: Point2D;
        startData: any;
        shapeId: number;
    }>({ active: false, type: 'move', handle: null, startPoint: { x: 0, y: 0 }, startData: null, shapeId: -1 });
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const point = getCanvasCoords(e.clientX, e.clientY);
        const currentShapes = shapesRef.current;
        const currentSelected = selectedIdRef.current;
        const selectedShape = currentSelected ? currentShapes.find(s => s.id === currentSelected) : null;
        
        e.currentTarget.setPointerCapture(e.pointerId);
        
        if (selectedShape) {
            const handle = getHandleAtPoint(selectedShape, point.x, point.y);
            
            if (handle === 'rotate') {
                const bounds = selectedShape.getBounds();
                if (bounds) {
                    dragStateRef.current = {
                        active: true, type: 'rotate', handle: null,
                        startPoint: { x: point.x, y: point.y },
                        startData: { rotation: selectedShape.transform.rotation, centerX: bounds.centerX, centerY: bounds.centerY },
                        shapeId: selectedShape.id,
                    };
                }
                return;
            } else if (handle) {
                const bounds = selectedShape.getBounds();
                if (bounds) {
                    dragStateRef.current = {
                        active: true, type: 'resize', handle: handle,
                        startPoint: { x: point.x, y: point.y },
                        startData: {
                            x: selectedShape.transform.x, y: selectedShape.transform.y,
                            scaleX: selectedShape.transform.scaleX, scaleY: selectedShape.transform.scaleY,
                            width: bounds.width, height: bounds.height,
                        },
                        shapeId: selectedShape.id,
                    };
                }
                return;
            } else if (selectedShape.hitTest(point.x, point.y)) {
                dragStateRef.current = {
                    active: true, type: 'move', handle: null,
                    startPoint: { x: point.x, y: point.y },
                    startData: { x: selectedShape.transform.x, y: selectedShape.transform.y },
                    shapeId: selectedShape.id,
                };
                return;
            }
        }
        
        const shapeUnderCursor = getShapeAtPoint(point.x, point.y);
        if (shapeUnderCursor) {
            setSelectedId(shapeUnderCursor.id);
            dragStateRef.current = {
                active: true, type: 'move', handle: null,
                startPoint: { x: point.x, y: point.y },
                startData: { x: shapeUnderCursor.transform.x, y: shapeUnderCursor.transform.y },
                shapeId: shapeUnderCursor.id,
            };
        } else {
            setSelectedId(null);
        }
    }, [getCanvasCoords, getShapeAtPoint, getHandleAtPoint]);
    
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!dragStateRef.current.active) return;
        e.preventDefault();
        
        const point = getCanvasCoords(e.clientX, e.clientY);
        const shape = shapesRef.current.find(s => s.id === dragStateRef.current.shapeId);
        if (!shape) return;
        
        const deltaX = point.x - dragStateRef.current.startPoint.x;
        const deltaY = point.y - dragStateRef.current.startPoint.y;
        
        if (dragStateRef.current.type === 'move') {
            shape.transform.x = dragStateRef.current.startData.x + deltaX;
            shape.transform.y = dragStateRef.current.startData.y + deltaY;
        } 
        else if (dragStateRef.current.type === 'resize' && dragStateRef.current.handle) {
            const data = dragStateRef.current.startData;
            const handle = dragStateRef.current.handle;
            
            let newMinX = data.x - data.width / 2;
            let newMinY = data.y - data.height / 2;
            let newMaxX = data.x + data.width / 2;
            let newMaxY = data.y + data.height / 2;
            
            switch (handle) {
                case 'nw': newMinX += deltaX; newMinY += deltaY; break;
                case 'ne': newMaxX += deltaX; newMinY += deltaY; break;
                case 'se': newMaxX += deltaX; newMaxY += deltaY; break;
                case 'sw': newMinX += deltaX; newMaxY += deltaY; break;
            }
            
            let newWidth = newMaxX - newMinX;
            let newHeight = newMaxY - newMinY;
            if (newWidth < MIN_SIZE) newWidth = MIN_SIZE;
            if (newHeight < MIN_SIZE) newHeight = MIN_SIZE;
            
            shape.transform.scaleX = data.scaleX * (newWidth / data.width);
            shape.transform.scaleY = data.scaleY * (newHeight / data.height);
            shape.transform.x = (newMinX + newMaxX) / 2;
            shape.transform.y = (newMinY + newMaxY) / 2;
        }
        else if (dragStateRef.current.type === 'rotate') {
            const data = dragStateRef.current.startData;
            const startAngle = Math.atan2(dragStateRef.current.startPoint.y - data.centerY, dragStateRef.current.startPoint.x - data.centerX);
            const currentAngle = Math.atan2(point.y - data.centerY, point.x - data.centerX);
            shape.transform.rotation = data.rotation + (currentAngle - startAngle);
        }
        
        needsRenderRef.current = true;
    }, [getCanvasCoords]);
    
    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        dragStateRef.current.active = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, []);
    
    // ========== КЛАВИАТУРА ==========
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete') deleteSelected();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [deleteSelected]);
    
    // ========== ОТРИСОВКА UI ВЫДЕЛЕНИЯ ==========
    const drawSelectionUI = useCallback((renderer: RasterRenderer, shape: Shape) => {
        const bounds = shape.getBounds();
        if (!bounds) return;
        
        // Рамка выделения
        const rect = [
            { x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.maxY }, { x: bounds.minX, y: bounds.maxY },
            { x: bounds.minX, y: bounds.minY }
        ];
        for (let i = 0; i < rect.length - 1; i++) {
            renderer.strokeLine(rect[i].x, rect[i].y, rect[i + 1].x, rect[i + 1].y, { r: 0, g: 100, b: 200, a: 255 }, 2);
        }
        
        // Угловые ручки
        const corners = getShapeCorners(shape);
        if (corners) {
            for (const corner of corners) {
                const s = HANDLE_SIZE;
                const pts = [
                    { x: corner.x - s/2, y: corner.y - s/2 }, { x: corner.x + s/2, y: corner.y - s/2 },
                    { x: corner.x + s/2, y: corner.y + s/2 }, { x: corner.x - s/2, y: corner.y + s/2 },
                ];
                renderer.fillPolygon(pts, { r: 0, g: 150, b: 255, a: 255 });
                renderer.strokePolygon(pts, { r: 255, g: 255, b: 255, a: 255 }, 1);
            }
        }
        
        // Ручка поворота
        const center = { x: bounds.centerX, y: bounds.centerY };
        const topCenter = { x: bounds.centerX, y: bounds.minY };
        const dir = Math.atan2(topCenter.y - center.y, topCenter.x - center.x);
        const rotX = center.x + Math.cos(dir) * ROTATION_HANDLE_DISTANCE;
        const rotY = center.y + Math.sin(dir) * ROTATION_HANDLE_DISTANCE;
        const s = HANDLE_SIZE;
        const pts = [
            { x: rotX - s/2, y: rotY - s/2 }, { x: rotX + s/2, y: rotY - s/2 },
            { x: rotX + s/2, y: rotY + s/2 }, { x: rotX - s/2, y: rotY + s/2 },
        ];
        renderer.fillPolygon(pts, { r: 255, g: 150, b: 0, a: 255 });
        renderer.strokePolygon(pts, { r: 255, g: 255, b: 255, a: 255 }, 1);
    }, [getShapeCorners]);
    
    useEffect(() => {
        drawSelectionUIRef.current = drawSelectionUI;
    }, [drawSelectionUI]);
    
    // ========== РЕНДЕР-ЦИКЛ (запускается один раз) ==========
    useEffect(() => {
        isMountedRef.current = true;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const renderer = new RasterRenderer(canvas);
        rendererRef.current = renderer;
        
        const resizeObserver = new ResizeObserver(() => {
            if (rendererRef.current) {
                rendererRef.current.resize();
                needsRenderRef.current = true;
            }
        });
        
        const container = containerRef.current;
        if (container) resizeObserver.observe(container);
        else resizeObserver.observe(canvas);
        
        let frameId: number;
        
        const animate = () => {
            if (!isMountedRef.current) return;
            
            const r = rendererRef.current;
            const currentShapes = shapesRef.current;
            const currentSelectedId = selectedIdRef.current;
            
            // Рисуем только если нужна перерисовка
            if (r && needsRenderRef.current) {
                r.beginFrame(true);
                
                for (const shape of currentShapes) {
                    shape.drawRaster(r);
                }
                
                const selectedShape = currentShapes.find(s => s.id === currentSelectedId);
                if (selectedShape) {
                    drawSelectionUIRef.current(r, selectedShape);
                }
                
                r.commit();
                needsRenderRef.current = false;
            }
            
            frameId = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            isMountedRef.current = false;
            if (frameId) cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            if (rendererRef.current) rendererRef.current.dispose();
        };
    }, []); // пустой массив Цикл запускается только один раз
    
    return (
        <div className="flex flex-col gap-4 w-full h-full bg-slate-900 text-white">
            {/* Панель инструментов */}
            <div className="flex gap-2 p-2 bg-slate-800 border-b border-slate-700 shrink-0">
                <button 
                    onClick={deleteSelected} 
                    disabled={selectedId === null}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm disabled:opacity-50"
                >
                    Удалить (Delete)
                </button>
                <span className="text-gray-400 text-sm px-2 self-center ml-auto">
                    Перетаскивание | Ручки для изменения размера | Оранжевая ручка для поворота
                </span>
            </div>
            
            <div className="flex flex-1 overflow-hidden gap-2 p-2 min-h-0">
                <div ref={containerRef} className="flex-1 bg-black border border-slate-700 rounded overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                </div>
                
                {/* Панель слоёв */}
                <aside className="w-64 bg-slate-800 border border-slate-700 rounded p-3 overflow-y-auto shrink-0">
                    <h3 className="font-bold mb-2">Слои</h3>
                    {shapes.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет фигур</p>
                    ) : (
                        <ul className="space-y-1">
                            {[...shapes].reverse().map((shape) => (
                                <li
                                    key={shape.id}
                                    className={`p-2 rounded text-sm cursor-pointer flex items-center justify-between ${
                                        selectedId === shape.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                                    }`}
                                    onClick={() => setSelectedId(shape.id)}
                                >
                                    <span className="truncate">{shape.constructor.name} #{shape.id}</span>
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); moveDown(shape.id); }} 
                                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-xs rounded"
                                        >
                                            ↓
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); moveUp(shape.id); }} 
                                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-xs rounded"
                                        >
                                            ↑
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    );
}