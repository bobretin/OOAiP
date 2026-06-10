import { Shape } from './Shape';
import { Bounds, createBounds, boundsFromPoints } from './Bounds';
import { RasterRenderer, hexToRGBA } from '../raster/RasterRenderer';
import { mat3 } from '../math/mat3';

export class Oval extends Shape {
    radiusX: number;
    radiusY: number;

    constructor(
        id: string,
        x: number = 0,
        y: number = 0,
        radiusX: number = 50,
        radiusY: number = 30,
        rotation: number = 0
    ) {
        super(id, { x, y, rotation, scaleX: 1, scaleY: 1 });
        this.radiusX = radiusX;
        this.radiusY = radiusY;
    }

    // Получить точки эллипса в локальных координатах (параметрическое уравнение)
    getLocalPoints(segments: number = 36): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.radiusX;
            const y = Math.sin(angle) * this.radiusY;
            points.push({ x, y });
        }
        return points;
    }

    // Получить точки эллипса в экранных координатах
    getDevicePoints(segments: number = 36): { x: number; y: number }[] {
        const points = this.getLocalPoints(segments);
        const m = this.getLocalToDeviceMatrix();
        return points.map(p => mat3.transformPoint(m, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints(36);
        const fillRGBA = hexToRGBA(this.fillStyle, this.fillOpacity * 255);
        const strokeRGBA = hexToRGBA(this.strokeStyle, this.strokeOpacity * 255);
        
        // Рисуем заливку
        if (this.fillOpacity > 0) {
            r.fillPolygon(points, fillRGBA);
        }
        
        // Рисуем обводку
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokePolygon(points, strokeRGBA, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        
        // Уравнение эллипса: (x/rx)^2 + (y/ry)^2 <= 1
        const dx = local.x / this.radiusX;
        const dy = local.y / this.radiusY;
        
        return dx * dx + dy * dy <= 1;
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.getDevicePoints(36));
    }

    getLocalBounds(): Bounds {
        return createBounds(-this.radiusX, -this.radiusY, this.radiusX, this.radiusY);
    }

    toJSON(): object {
        return {
            type: 'oval',
            id: this.id,
            x: this.transform.x,
            y: this.transform.y,
            radiusX: this.radiusX,
            radiusY: this.radiusY,
            rotation: this.transform.rotation,
            scaleX: this.transform.scaleX,
            scaleY: this.transform.scaleY,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }

    clone(): Oval {
        const oval = new Oval(this.id, this.transform.x, this.transform.y, this.radiusX, this.radiusY, this.transform.rotation);
        oval.transform.scaleX = this.transform.scaleX;
        oval.transform.scaleY = this.transform.scaleY;
        oval.fillStyle = this.fillStyle;
        oval.fillOpacity = this.fillOpacity;
        oval.strokeStyle = this.strokeStyle;
        oval.strokeWidth = this.strokeWidth;
        oval.strokeOpacity = this.strokeOpacity;
        return oval;
    }
}