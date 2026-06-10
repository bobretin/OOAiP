import { mat3, Mat3, Point2D } from '../math/mat3';
import { Transform, identityTransform } from './Transform';
import { Bounds } from './Bounds';
import { RasterRenderer, RGBA } from '../raster/RasterRenderer';

export interface ShapeStyle {
    fillStyle: string;
    fillOpacity: number;
    strokeStyle: string;
    strokeWidth: number;
    strokeOpacity: number;
}

export abstract class Shape {
    id: string;
    transform: Transform;
    
    // Стили
    fillStyle: string = '#ffffff';
    fillOpacity: number = 1;
    strokeStyle: string = '#000000';
    strokeWidth: number = 1;
    strokeOpacity: number = 1;

    constructor(id: string, transform?: Transform) {
        this.id = id;
        this.transform = transform || identityTransform();
    }

    // Получить матрицу перехода из локальных координат в экранные
    getLocalToDeviceMatrix(): Mat3 {
        return mat3.fromTransform(
            this.transform.x,
            this.transform.y,
            this.transform.rotation,
            this.transform.scaleX,
            this.transform.scaleY
        );
    }

    // Получить обратную матрицу (экранные -> локальные)
    getDeviceToLocalMatrix(): Mat3 | null {
        return mat3.invert(this.getLocalToDeviceMatrix());
    }

    // Перевести точку из локальных координат в экранные
    transformPointToDevice(px: number, py: number): Point2D {
        const m = this.getLocalToDeviceMatrix();
        return mat3.transformPoint(m, px, py);
    }

    // Перевести точку из экранных координат в локальные
    transformPointToLocal(px: number, py: number): Point2D | null {
        const inv = this.getDeviceToLocalMatrix();
        if (!inv) return null;
        return mat3.transformPoint(inv, px, py);
    }

    // Получить центр фигуры в экранных координатах
    getCenter(): Point2D {
        const localBounds = this.getLocalBounds();
        const cx = (localBounds.minX + localBounds.maxX) / 2;
        const cy = (localBounds.minY + localBounds.maxY) / 2;
        return this.transformPointToDevice(cx, cy);
    }

    // Изменить границы фигуры (для ресайза)
    resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
        const oldCenter = this.getCenter();
        const newCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        
        // Обновляем позицию
        this.transform.x += newCenter.x - oldCenter.x;
        
        // Получаем локальные границы и обновляем масштаб
        const localBounds = this.getLocalBounds();
        const oldWidth = localBounds.maxX - localBounds.minX;
        const oldHeight = localBounds.maxY - localBounds.minY;
        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        
        if (oldWidth > 0) this.transform.scaleX *= newWidth / oldWidth;
        if (oldHeight > 0) this.transform.scaleY *= newHeight / oldHeight;
        
        this.updateFromLocalBounds(this.getLocalBounds());
    }

    // Обёртка для resizeFromDeviceAABB
    setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
        this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
    }

    // Создать копию фигуры
    abstract clone(): Shape;

    // Абстрактные методы (должны быть реализованы в наследниках)
    abstract drawRaster(r: RasterRenderer): void;
    abstract hitTest(px: number, py: number): boolean;
    abstract getBounds(): Bounds;
    abstract getLocalBounds(): Bounds;
    abstract toJSON(): object;
    
    // Обновить фигуру из локальных границ (должен переопределять наследник при необходимости)
    protected updateFromLocalBounds(_bounds: Bounds): void {}
}