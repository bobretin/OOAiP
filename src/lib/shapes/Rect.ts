import { Shape } from './Shape';
import { Bounds, createBounds, boundsFromPoints } from './Bounds';
import { RasterRenderer, hexToRGBA } from '../raster/RasterRenderer';
import { mat3 } from '../math/mat3';

export class Rect extends Shape {
    width: number;
    height: number;

    constructor(
        id: string,
        x: number = 0,
        y: number = 0,
        width: number = 100,
        height: number = 100,
        rotation: number = 0
    ) {
        super(id, { x, y, rotation, scaleX: 1, scaleY: 1 });
        this.width = width;
        this.height = height;
    }

    // Получить 4 угла прямоугольника в локальных координатах
    getLocalCorners(): { x: number; y: number }[] {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        return [
            { x: -halfW, y: -halfH },
            { x: halfW, y: -halfH },
            { x: halfW, y: halfH },
            { x: -halfW, y: halfH }
        ];
    }

    // Получить углы в экранных координатах
    getDeviceCorners(): { x: number; y: number }[] {
        const corners = this.getLocalCorners();
        const m = this.getLocalToDeviceMatrix();
        return corners.map(c => mat3.transformPoint(m, c.x, c.y));
    }

    drawRaster(r: RasterRenderer): void {
        const corners = this.getDeviceCorners();
        const fillRGBA = hexToRGBA(this.fillStyle, this.fillOpacity * 255);
        const strokeRGBA = hexToRGBA(this.strokeStyle, this.strokeOpacity * 255);
        
        // Рисуем заливку
        if (this.fillOpacity > 0) {
            r.fillPolygon(corners, fillRGBA);
        }
        
        // Рисуем обводку
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokePolygon(corners, strokeRGBA, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        
        return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.getDeviceCorners());
    }

    getLocalBounds(): Bounds {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        return createBounds(-halfW, -halfH, halfW, halfH);
    }

    toJSON(): object {
        return {
            type: 'rect',
            id: this.id,
            x: this.transform.x,
            y: this.transform.y,
            width: this.width,
            height: this.height,
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

    clone(): Rect {
        const rect = new Rect(this.id, this.transform.x, this.transform.y, this.width, this.height, this.transform.rotation);
        rect.transform.scaleX = this.transform.scaleX;
        rect.transform.scaleY = this.transform.scaleY;
        rect.fillStyle = this.fillStyle;
        rect.fillOpacity = this.fillOpacity;
        rect.strokeStyle = this.strokeStyle;
        rect.strokeWidth = this.strokeWidth;
        rect.strokeOpacity = this.strokeOpacity;
        return rect;
    }
}