import { Shape } from './Shape';
import { Bounds, boundsFromPoints } from './Bounds';
import { RasterRenderer, hexToRGBA } from '../raster/RasterRenderer';
import { mat3 } from '../math/mat3';

export type PathMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
    private _points: { x: number; y: number }[];
    private _mode: PathMode;
    private _closed: boolean;

    constructor(
        id: string,
        points: { x: number; y: number }[] = [],
        mode: PathMode = 'polyline',
        closed: boolean = false
    ) {
        // Вычисляем центр
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        
        super(id, { x: cx, y: cy, rotation: 0, scaleX: 1, scaleY: 1 });
        
        // Переводим точки в локальные координаты
        this._points = points.map(p => ({ x: p.x - cx, y: p.y - cy }));
        this._mode = mode;
        this._closed = closed;
    }

    // Преобразование Catmull-Rom сегмента в кубическую Безье
    private catmullRomToBezier(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): { p1: { x: number; y: number }, p2: { x: number; y: number } } {
        const tension = 0.5;
        return {
            p1: {
                x: p1.x + (p2.x - p0.x) * tension,
                y: p1.y + (p2.y - p0.y) * tension
            },
            p2: {
                x: p2.x - (p3.x - p1.x) * tension,
                y: p2.y - (p3.y - p1.y) * tension
            }
        };
    }

    // Вспомогательный метод для аппроксимации кубической Безье
    private flattenCubicBezier(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, segments: number): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
            const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
            points.push({ x, y });
        }
        return points;
    }

    // Получить все точки пути в локальных координатах
    private getLocalPathPoints(): { x: number; y: number }[] {
        if (this._points.length === 0) return [];
        
        if (this._mode === 'polyline') {
            return [...this._points];
        }
        
        if (this._mode === 'bezier') {
            // Для режима bezier точки интерпретируются как сегменты
            // Каждый сегмент: p0, p1, p2, p3 (кубическая Безье)
            const points: { x: number; y: number }[] = [];
            const n = this._points.length;
            
            for (let i = 0; i + 3 < n; i += 3) {
                const bezierPoints = this.flattenCubicBezier(
                    this._points[i], this._points[i + 1], this._points[i + 2], this._points[i + 3],
                    20
                );
                points.push(...bezierPoints);
            }
            return points;
        }
        
        // Catmull-Rom режим
        const points: { x: number; y: number }[] = [];
        const n = this._points.length;
        
        for (let i = 0; i < n - 1; i++) {
            const p0 = this._points[Math.max(0, i - 1)];
            const p1 = this._points[i];
            const p2 = this._points[i + 1];
            const p3 = this._points[Math.min(n - 1, i + 2)];
            
            const { p1: cp1, p2: cp2 } = this.catmullRomToBezier(p0, p1, p2, p3);
            
            // Аппроксимируем сегмент
            const bezierPoints = this.flattenCubicBezier(p1, cp1, cp2, p2, 20);
            points.push(...bezierPoints);
        }
        
        if (this._closed && n > 2) {
            // Добавляем замыкающий сегмент
            const p0 = this._points[n - 2];
            const p1 = this._points[n - 1];
            const p2 = this._points[0];
            const p3 = this._points[1];
            
            const { p1: cp1, p2: cp2 } = this.catmullRomToBezier(p0, p1, p2, p3);
            
            const bezierPoints = this.flattenCubicBezier(p1, cp1, cp2, p2, 20);
            points.push(...bezierPoints);
        }
        
        return points;
    }

    getDevicePoints(): { x: number; y: number }[] {
        const points = this.getLocalPathPoints();
        const m = this.getLocalToDeviceMatrix();
        return points.map(p => mat3.transformPoint(m, p.x, p.y));
    }

    private distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const ax = px - x1;
        const ay = py - y1;
        const bx = x2 - x1;
        const by = y2 - y1;
        const dot = ax * bx + ay * by;
        const len2 = bx * bx + by * by;
        if (len2 === 0) return Math.hypot(ax, ay);
        let t = dot / len2;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * bx;
        const projY = y1 + t * by;
        return Math.hypot(px - projX, py - projY);
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints();
        const strokeRGBA = hexToRGBA(this.strokeStyle, this.strokeOpacity * 255);
        
        if (points.length < 2) return;
        
        for (let i = 0; i < points.length - 1; i++) {
            r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeRGBA, this.strokeWidth);
        }
        
        if (this._closed && points.length > 1) {
            const last = points[points.length - 1];
            const first = points[0];
            r.strokeLine(last.x, last.y, first.x, first.y, strokeRGBA, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const devicePoints = this.getDevicePoints();
        const threshold = Math.max(5, this.strokeWidth);
        
        if (devicePoints.length < 2) return false;
        
        for (let i = 0; i < devicePoints.length - 1; i++) {
            const dist = this.distanceToSegment(px, py, devicePoints[i].x, devicePoints[i].y, devicePoints[i + 1].x, devicePoints[i + 1].y);
            if (dist <= threshold) return true;
        }
        
        if (this._closed && devicePoints.length > 1) {
            const last = devicePoints[devicePoints.length - 1];
            const first = devicePoints[0];
            const dist = this.distanceToSegment(px, py, last.x, last.y, first.x, first.y);
            if (dist <= threshold) return true;
        }
        
        return false;
    }

    getBounds(): Bounds {
        const points = this.getDevicePoints();
        if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        return boundsFromPoints(points);
    }

    getLocalBounds(): Bounds {
        const points = this.getLocalPathPoints();
        if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        return boundsFromPoints(points);
    }

    getControlPoints(): { x: number; y: number }[] {
        const cx = this.transform.x;
        const cy = this.transform.y;
        return this._points.map(p => ({ x: p.x + cx, y: p.y + cy }));
    }

    setControlPoint(idx: number, x: number, y: number): void {
        const cx = this.transform.x;
        const cy = this.transform.y;
        if (idx >= 0 && idx < this._points.length) {
            this._points[idx] = { x: x - cx, y: y - cy };
        }
    }

    addPoint(x: number, y: number): void {
        const cx = this.transform.x;
        const cy = this.transform.y;
        this._points.push({ x: x - cx, y: y - cy });
    }

    removePoint(idx: number): void {
        if (idx >= 0 && idx < this._points.length) {
            this._points.splice(idx, 1);
        }
    }

    setMode(mode: PathMode): void {
        this._mode = mode;
    }

    setClosed(closed: boolean): void {
        this._closed = closed;
    }

    toJSON(): object {
        const cx = this.transform.x;
        const cy = this.transform.y;
        return {
            type: 'path',
            id: this.id,
            points: this._points.map(p => ({ x: p.x + cx, y: p.y + cy })),
            mode: this._mode,
            closed: this._closed,
            rotation: this.transform.rotation,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }

    clone(): PathBezier {
        const cx = this.transform.x;
        const cy = this.transform.y;
        const path = new PathBezier(
            this.id,
            this._points.map(p => ({ x: p.x + cx, y: p.y + cy })),
            this._mode,
            this._closed
        );
        path.transform = { ...this.transform };
        path.strokeStyle = this.strokeStyle;
        path.strokeWidth = this.strokeWidth;
        path.strokeOpacity = this.strokeOpacity;
        return path;
    }
}