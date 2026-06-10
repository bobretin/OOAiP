import { Shape } from './Shape';
import { Bounds, boundsFromPoints } from './Bounds';
import { RasterRenderer, hexToRGBA } from '../raster/RasterRenderer';
import { mat3 } from '../math/mat3';

export class Triangle extends Shape {
    // Три вершины в локальных координатах (относительно центра)
    private _p0: { x: number; y: number };
    private _p1: { x: number; y: number };
    private _p2: { x: number; y: number };

    constructor(
        id: string,
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number
    ) {
        // Вычисляем центр треугольника
        const cx = (x1 + x2 + x3) / 3;
        const cy = (y1 + y2 + y3) / 3;
        
        super(id, { x: cx, y: cy, rotation: 0, scaleX: 1, scaleY: 1 });
        
        // Храним вершины относительно центра
        this._p0 = { x: x1 - cx, y: y1 - cy };
        this._p1 = { x: x2 - cx, y: y2 - cy };
        this._p2 = { x: x3 - cx, y: y3 - cy };
    }

    // Получить все вершины в локальных координатах
    getLocalVertices(): { x: number; y: number }[] {
        return [this._p0, this._p1, this._p2];
    }

    // Получить вершины в экранных координатах
    getDeviceVertices(): { x: number; y: number }[] {
        const vertices = this.getLocalVertices();
        const m = this.getLocalToDeviceMatrix();
        return vertices.map(v => mat3.transformPoint(m, v.x, v.y));
    }

    // Проверка: находится ли точка внутри треугольника (метод знаков)
    private pointInTriangle(px: number, py: number): boolean {
        const sign = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
            (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
        
        const d1 = sign(px, py, this._p0.x, this._p0.y, this._p1.x, this._p1.y);
        const d2 = sign(px, py, this._p1.x, this._p1.y, this._p2.x, this._p2.y);
        const d3 = sign(px, py, this._p2.x, this._p2.y, this._p0.x, this._p0.y);
        
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
        return !(hasNeg && hasPos);
    }

    drawRaster(r: RasterRenderer): void {
        const vertices = this.getDeviceVertices();
        const fillRGBA = hexToRGBA(this.fillStyle, this.fillOpacity * 255);
        const strokeRGBA = hexToRGBA(this.strokeStyle, this.strokeOpacity * 255);
        
        if (this.fillOpacity > 0) {
            r.fillPolygon(vertices, fillRGBA);
        }
        
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokePolygon(vertices, strokeRGBA, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        return this.pointInTriangle(local.x, local.y);
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.getDeviceVertices());
    }

    getLocalBounds(): Bounds {
        return boundsFromPoints(this.getLocalVertices());
    }

    toJSON(): object {
        const vertices = this.getLocalVertices();
        // Преобразуем обратно в мировые координаты для JSON
        const cx = this.transform.x;
        const cy = this.transform.y;
        return {
            type: 'triangle',
            id: this.id,
            x1: vertices[0].x + cx,
            y1: vertices[0].y + cy,
            x2: vertices[1].x + cx,
            y2: vertices[1].y + cy,
            x3: vertices[2].x + cx,
            y3: vertices[2].y + cy,
            rotation: this.transform.rotation,
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }

    clone(): Triangle {
        const vertices = this.getLocalVertices();
        const cx = this.transform.x;
        const cy = this.transform.y;
        const triangle = new Triangle(
            this.id,
            vertices[0].x + cx, vertices[0].y + cy,
            vertices[1].x + cx, vertices[1].y + cy,
            vertices[2].x + cx, vertices[2].y + cy
        );
        triangle.transform = { ...this.transform };
        triangle.fillStyle = this.fillStyle;
        triangle.fillOpacity = this.fillOpacity;
        triangle.strokeStyle = this.strokeStyle;
        triangle.strokeWidth = this.strokeWidth;
        triangle.strokeOpacity = this.strokeOpacity;
        return triangle;
    }
}