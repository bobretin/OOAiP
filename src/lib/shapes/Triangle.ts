import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { RasterRenderer } from '../raster/RasterRenderer';
import { Point2D } from '../math/mat3';

export class Triangle extends Shape {
    private _p1: Point2D;
    private _p2: Point2D;
    private _p3: Point2D;

    // Основной конструктор - принимает три вершины
    constructor(p1: Point2D, p2: Point2D, p3: Point2D) {
        super();

        // Вычисляем центр масс
        const cx = (p1.x + p2.x + p3.x) / 3;
        const cy = (p1.y + p2.y + p3.y) / 3;

        // Сохраняем вершины относительно центра
        this._p1 = { x: p1.x - cx, y: p1.y - cy };
        this._p2 = { x: p2.x - cx, y: p2.y - cy };
        this._p3 = { x: p3.x - cx, y: p3.y - cy };
        
        // Устанавливаем трансформацию в центр
        this.transform.x = cx;
        this.transform.y = cy;
    }

    // Статический метод для создания равнобедренного треугольника
    static fromWidthHeight(w: number, h: number): Triangle {
        const apex = { x: 0, y: -h / 2 };
        const leftBase = { x: -w / 2, y: h / 2 };
        const rightBase = { x: w / 2, y: h / 2 };
        return new Triangle(apex, leftBase, rightBase);
    }

    // Геттеры для вершин
    get p1(): Point2D { return { ...this._p1 }; }
    get p2(): Point2D { return { ...this._p2 }; }
    get p3(): Point2D { return { ...this._p3 }; }

    getControlPoints(): Point2D[] {
        return [this._p1, this._p2, this._p3];
    }

    setControlPoint(idx: number, pt: Point2D): void {
        switch (idx) {
            case 0: this._p1 = { ...pt }; break;
            case 1: this._p2 = { ...pt }; break;
            case 2: this._p3 = { ...pt }; break;
            default: throw new Error(`Invalid control point index: ${idx}`);
        }
    }

    getLocalBounds(): Bounds | null {
        return Bounds.fromPoints([this.p1, this.p2, this.p3]);
    }

    getBounds(): Bounds | null {
        const points = [
            this.transformPointToDevice(this.p1.x, this.p1.y),
            this.transformPointToDevice(this.p2.x, this.p2.y),
            this.transformPointToDevice(this.p3.x, this.p3.y),
        ];
        return Bounds.fromPoints(points);
    }

    drawRaster(r: RasterRenderer): void {
        const devicePoints = [
            this.transformPointToDevice(this.p1.x, this.p1.y),
            this.transformPointToDevice(this.p2.x, this.p2.y),
            this.transformPointToDevice(this.p3.x, this.p3.y),
        ];

        if (this.fillOpacity > 0) {
            r.fillPolygon(devicePoints, this.getFillColor());
        }

        if (this.strokeOpacity > 0 && this.strokeWidth > 0) {
            r.strokePolygon(devicePoints, this.getStrokeColor(), this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const localP = this.transformPointToLocal(px, py);
        if (!localP) return false;
        
        const sign = (p1: Point2D, p2: Point2D, p3: Point2D) => {
            return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
        };

        const d1 = sign(localP, this._p1, this._p2);
        const d2 = sign(localP, this._p2, this._p3);
        const d3 = sign(localP, this._p3, this._p1);

        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

        return !(hasNeg && hasPos);
    }

    toJSON(): any {
        return {
            type: 'Triangle',
            p1: this._p1,
            p2: this._p2,
            p3: this._p3,
            transform: {
                x: this.transform.x,
                y: this.transform.y,
                rotation: this.transform.rotation,
                scaleX: this.transform.scaleX,
                scaleY: this.transform.scaleY
            },
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }

    clone(): Triangle {
        const cloned = new Triangle(
            { ...this._p1 },
            { ...this._p2 },
            { ...this._p3 }
        );
        cloned.transform = this.transform.clone();
        cloned.fillStyle = this.fillStyle;
        cloned.fillOpacity = this.fillOpacity;
        cloned.strokeStyle = this.strokeStyle;
        cloned.strokeWidth = this.strokeWidth;
        cloned.strokeOpacity = this.strokeOpacity;
        return cloned;
    }
}