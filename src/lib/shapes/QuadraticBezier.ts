import { Shape } from './Shape';
import { Bounds, boundsFromPoints } from './Bounds';
import { RasterRenderer, hexToRGBA } from '../raster/RasterRenderer';
import { mat3 } from '../math/mat3';

export class QuadraticBezier extends Shape {
    private _p0: { x: number; y: number };
    private _p1: { x: number; y: number };
    private _p2: { x: number; y: number };

    constructor(
        id: string,
        x0: number, y0: number,  // начало
        x1: number, y1: number,  // управляющая точка
        x2: number, y2: number   // конец
    ) {
        // Вычисляем центр ограничивающего прямоугольника
        const minX = Math.min(x0, x1, x2);
        const maxX = Math.max(x0, x1, x2);
        const minY = Math.min(y0, y1, y2);
        const maxY = Math.max(y0, y1, y2);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        
        super(id, { x: cx, y: cy, rotation: 0, scaleX: 1, scaleY: 1 });
        
        // Храним точки относительно центра
        this._p0 = { x: x0 - cx, y: y0 - cy };
        this._p1 = { x: x1 - cx, y: y1 - cy };
        this._p2 = { x: x2 - cx, y: y2 - cy };
    }

    // Вычисление точки на кривой Безье при заданном t (0..1)
    evalLocal(t: number): { x: number; y: number } {
        const mt = 1 - t;
        const x = mt * mt * this._p0.x + 2 * mt * t * this._p1.x + t * t * this._p2.x;
        const y = mt * mt * this._p0.y + 2 * mt * t * this._p1.y + t * t * this._p2.y;
        return { x, y };
    }

    // Аппроксимация кривой ломаной (количество сегментов)
    flattenLocal(segments: number = 30): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(this.evalLocal(t));
        }
        return points;
    }

    // Получить точки в экранных координатах
    getDevicePoints(segments: number = 30): { x: number; y: number }[] {
        const points = this.flattenLocal(segments);
        const m = this.getLocalToDeviceMatrix();
        return points.map(p => mat3.transformPoint(m, p.x, p.y));
    }

    // Расстояние от точки до отрезка
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
        const points = this.getDevicePoints(50);
        const strokeRGBA = hexToRGBA(this.strokeStyle, this.strokeOpacity * 255);
        
        // Рисуем линию (только обводка, кривая не имеет заливки)
        for (let i = 0; i < points.length - 1; i++) {
            r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeRGBA, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const devicePoints = this.getDevicePoints(50);
        const threshold = Math.max(5, this.strokeWidth);
        
        for (let i = 0; i < devicePoints.length - 1; i++) {
            const dist = this.distanceToSegment(px, py, devicePoints[i].x, devicePoints[i].y, devicePoints[i + 1].x, devicePoints[i + 1].y);
            if (dist <= threshold) return true;
        }
        return false;
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.getDevicePoints(50));
    }

    getLocalBounds(): Bounds {
        return boundsFromPoints(this.flattenLocal(30));
    }

    getControlPoints(): { x: number; y: number }[] {
        const cx = this.transform.x;
        const cy = this.transform.y;
        return [
            { x: this._p0.x + cx, y: this._p0.y + cy },
            { x: this._p1.x + cx, y: this._p1.y + cy },
            { x: this._p2.x + cx, y: this._p2.y + cy }
        ];
    }

    setControlPoint(idx: number, x: number, y: number): void {
        const cx = this.transform.x;
        const cy = this.transform.y;
        const localX = x - cx;
        const localY = y - cy;
        
        if (idx === 0) this._p0 = { x: localX, y: localY };
        else if (idx === 1) this._p1 = { x: localX, y: localY };
        else if (idx === 2) this._p2 = { x: localX, y: localY };
    }

    toJSON(): object {
        const cx = this.transform.x;
        const cy = this.transform.y;
        return {
            type: 'quadratic',
            id: this.id,
            x0: this._p0.x + cx, y0: this._p0.y + cy,
            x1: this._p1.x + cx, y1: this._p1.y + cy,
            x2: this._p2.x + cx, y2: this._p2.y + cy,
            rotation: this.transform.rotation,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }

    clone(): QuadraticBezier {
        const cx = this.transform.x;
        const cy = this.transform.y;
        const curve = new QuadraticBezier(
            this.id,
            this._p0.x + cx, this._p0.y + cy,
            this._p1.x + cx, this._p1.y + cy,
            this._p2.x + cx, this._p2.y + cy
        );
        curve.transform = { ...this.transform };
        curve.strokeStyle = this.strokeStyle;
        curve.strokeWidth = this.strokeWidth;
        curve.strokeOpacity = this.strokeOpacity;
        return curve;
    }
}