import { Shape } from './Shape';
import { Bounds, createBounds, boundsFromPoints } from './Bounds';
import { RasterRenderer, hexToRGBA } from '../raster/RasterRenderer';
import { mat3 } from '../math/mat3';

export class Line extends Shape {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(
        id: string,
        x1: number = 0,
        y1: number = 0,
        x2: number = 100,
        y2: number = 0
    ) {
        // Центр линии — средняя точка
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        super(id, { x: cx, y: cy, rotation: 0, scaleX: 1, scaleY: 1 });
        
        // Храним смещения относительно центра
        this.x1 = x1 - cx;
        this.y1 = y1 - cy;
        this.x2 = x2 - cx;
        this.y2 = y2 - cy;
    }

    // Получить концы линии в локальных координатах
    getLocalEndpoints(): { x: number; y: number }[] {
        return [
            { x: this.x1, y: this.y1 },
            { x: this.x2, y: this.y2 }
        ];
    }

    // Получить концы линии в экранных координатах
    getDeviceEndpoints(): { x: number; y: number }[] {
        const endpoints = this.getLocalEndpoints();
        const m = this.getLocalToDeviceMatrix();
        return endpoints.map(e => mat3.transformPoint(m, e.x, e.y));
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
        const endpoints = this.getDeviceEndpoints();
        const strokeRGBA = hexToRGBA(this.strokeStyle, this.strokeOpacity * 255);
        
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokeLine(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y, strokeRGBA, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        
        const distance = this.distanceToSegment(local.x, local.y, this.x1, this.y1, this.x2, this.y2);
        const threshold = Math.max(5, this.strokeWidth / 2);
        
        return distance <= threshold;
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.getDeviceEndpoints());
    }

    getLocalBounds(): Bounds {
        return createBounds(
            Math.min(this.x1, this.x2),
            Math.min(this.y1, this.y2),
            Math.max(this.x1, this.x2),
            Math.max(this.y1, this.y2)
        );
    }

    toJSON(): object {
        const endpoints = this.getLocalEndpoints();
        return {
            type: 'line',
            id: this.id,
            x1: endpoints[0].x + this.transform.x,
            y1: endpoints[0].y + this.transform.y,
            x2: endpoints[1].x + this.transform.x,
            y2: endpoints[1].y + this.transform.y,
            rotation: this.transform.rotation,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }

    clone(): Line {
        const endpoints = this.getLocalEndpoints();
        const line = new Line(this.id, endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
        line.transform = { ...this.transform };
        line.strokeStyle = this.strokeStyle;
        line.strokeWidth = this.strokeWidth;
        line.strokeOpacity = this.strokeOpacity;
        return line;
    }
}