export type RGBA = {r: number; g: number; b: number; a: number};
export type LineAlg = 'bresenham' | 'wu';

// TODO: Реализуйте функцию ограничения значения байта (от 0 до 255)
export function clampByte(v: number): number {
    return Math.min(255, Math.max(0, Math.round(v)));
}

// TODO: Реализуйте парсинг HEX-строки 
export function hexToRGBA(hex: string, alpha = 255): RGBA {
    let r = 0, g = 0, b = 0;
    
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    }
    
    return { r, g, b, a: alpha };
}
export class RasterRenderer {
    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData | null = null;
    private buf!: Uint8ClampedArray;
    width = 0; // физические пиксели
    height = 0; // физические пиксели
    dpr = 1;
    private canvas: HTMLCanvasElement;
    private _onWindowResize: () => void;
    private lineAlg: LineAlg = 'bresenham';
    constructor (canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if(!ctx) {
            throw new Error('No 2D context');
        }
        this.ctx = ctx;
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
        this.resize();
    }
    dispose() {
        window.removeEventListener('resize', this._onWindowResize);
    }
    setLineAlgorithm(a: LineAlg){
        this.lineAlg = a;
    }
    getLineAlgorithm(): LineAlg {
        return this.lineAlg;
    }
    // Управляющий метод рисования линий
    drawLine(x0: number, y0:number, x1: number, y1: number, color: RGBA) {
        if (this.lineAlg==='wu'){
            this.drawLineWu(x0, y0, x1, y1, color);
        } else {
            this.drawLineBrassenham(x0, y0, x1, y1, color);
        }
    }
    // ===================================================================// 
    //  ЗАДАЧА: РЕАЛИЗОВАТЬ МЕТОДЫ НИЖЕ
    // ===================================================================
    // TODO: Вычисление 1D индекса в массиве buf п
    private idx(x:number, y:number): number {
        return (Math.floor(y) * this.width + Math.floor(x)) * 4;
    }

    // TODO: Установка одного пикселя.
    setPixel(x: number, y: number, color: RGBA){
        const index = this.idx(x, y);
        if (index >= 0 && index < this.buf.length) {
            this.buf[index] = clampByte(color.r);
            this.buf[index + 1] = clampByte(color.g);
            this.buf[index + 2] = clampByte(color.b);
            this.buf[index + 3] = clampByte(color.a);
        }
    }

    // TODO: Альфа-блендинг 
    private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1){
        const index = this.idx(x, y);
        if (index >= 0 && index < this.buf.length) {
            const srcA = clampByte(color.a * alphaFactor);
            if (srcA === 0) return;
            if (srcA === 255) {
                this.buf[index] = clampByte(color.r);
                this.buf[index + 1] = clampByte(color.g);
                this.buf[index + 2] = clampByte(color.b);
                this.buf[index + 3] = 255;
                return;
            }
            
            const dstR = this.buf[index];
            const dstG = this.buf[index + 1];
            const dstB = this.buf[index + 2];
            const dstA = this.buf[index + 3];
            
            const outA = srcA + dstA * (1 - srcA / 255);
            if (outA === 0) return;
            
            const outR = (clampByte(color.r) * srcA + dstR * dstA * (1 - srcA / 255)) / outA;
            const outG = (clampByte(color.g) * srcA + dstG * dstA * (1 - srcA / 255)) / outA;
            const outB = (clampByte(color.b) * srcA + dstB * dstA * (1 - srcA / 255)) / outA;
            
            this.buf[index] = clampByte(outR);
            this.buf[index + 1] = clampByte(outG);
            this.buf[index + 2] = clampByte(outB);
            this.buf[index + 3] = clampByte(outA);
        }
    }

    // TODO: Жизненный цикл кадра.
    resize() {
         this.dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = Math.floor(rect.width * this.dpr);
        this.height = Math.floor(rect.height * this.dpr);
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buf = this.imageData.data;
    }

    // TODO: Очистка буфера.
    beginFrame(clear = true){
        if (clear && this.buf) {
            this.buf.fill(0);
        }
    }

    // TODO: Вывод буфера на экран.
    commit() {
        if (this.imageData) {
            this.ctx.putImageData(this.imageData, 0, 0);
        }
    }

    // TODO: Алгоритм Брезенхема.
    drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = x0, y = y0;
        
        while (true) {
            this.setPixel(x, y, color);
            if (x === x1 && y === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    // TODO: Алгоритм Сяолиня Ву.
    drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
         const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    
        if (steep) {
            [x0, y0] = [y0, x0];
            [x1, y1] = [y1, x1];
        }
        
        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }
        
        const dx = x1 - x0;
        const dy = y1 - y0;
        const gradient = dx === 0 ? 1 : dy / dx;
        
        let xEnd = Math.round(x0);
        let yEnd = y0 + gradient * (xEnd - x0);
        const xPixel1 = xEnd;
        const yPixel1 = Math.floor(yEnd);
        
        if (steep) {
            this.blendPixel(yPixel1, xPixel1, color, 1 - (yEnd - yPixel1));
            this.blendPixel(yPixel1 + 1, xPixel1, color, yEnd - yPixel1);
        } else {
            this.blendPixel(xPixel1, yPixel1, color, 1 - (yEnd - yPixel1));
            this.blendPixel(xPixel1, yPixel1 + 1, color, yEnd - yPixel1);
        }
        
        let intery = yEnd + gradient;
        
        xEnd = Math.round(x1);
        yEnd = y1 + gradient * (xEnd - x1);
        const xPixel2 = xEnd;
        const yPixel2 = Math.floor(yEnd);
        
        if (steep) {
            this.blendPixel(yPixel2, xPixel2, color, 1 - (yEnd - yPixel2));
            this.blendPixel(yPixel2 + 1, xPixel2, color, yEnd - yPixel2);
        } else {
            this.blendPixel(xPixel2, yPixel2, color, 1 - (yEnd - yPixel2));
            this.blendPixel(xPixel2, yPixel2 + 1, color, yEnd - yPixel2);
        }
        
        for (let x = xPixel1 + 1; x < xPixel2; x++) {
            const y = intery;
            const frac = y - Math.floor(y);
            
            if (steep) {
                this.blendPixel(Math.floor(y), x, color, 1 - frac);
                this.blendPixel(Math.floor(y) + 1, x, color, frac);
            } else {
                this.blendPixel(x, Math.floor(y), color, 1 - frac);
                this.blendPixel(x, Math.floor(y) + 1, color, frac);
            }
            intery += gradient;
        }
    }

    // TODO: Отрисовка горизонтальной линии (для заливки).
    private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
        const start = Math.min(x0, x1);
        const end = Math.max(x0, x1);
        
        for (let x = start; x <= end; x++) {
            this.blendPixel(x, y, color, 1);
        }
    }

    // TODO: Заливка многоугольника (Scanline)
    fillPolygon(points: {x: number; y: number}[], color: RGBA) {
        if (points.length < 3) return;
    
        let minY = Infinity, maxY = -Infinity;
        for (const p of points) {
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }
        
        minY = Math.max(0, Math.floor(minY));
        maxY = Math.min(this.height - 1, Math.ceil(maxY));
        
        for (let y = minY; y <= maxY; y++) {
            const intersections: number[] = [];
            
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                
                if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                    const t = (y - p1.y) / (p2.y - p1.y);
                    const x = p1.x + t * (p2.x - p1.x);
                    intersections.push(x);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 < intersections.length) {
                    this.drawHSpan(y, intersections[i], intersections[i + 1], color);
                }
            }
        }
    }

    // TODO: Заливка окружности
    fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
        const r = Math.floor(radius);
        for (let y = -r; y <= r; y++) {
            const dy = cy + y;
            if (dy < 0 || dy >= this.height) continue;
            
            const dx = Math.sqrt(r * r - y * y);
            const x1 = cx - dx;
            const x2 = cx + dx;
            
            this.drawHSpan(dy, x1, x2, color);
        }
    }

    // TODO: Отрисовка толстого отрезка (прямоугольник + шапки)
    strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
        if (width <= 1) {
            this.drawLine(x0, y0, x1, y1, color);
            return;
        }
        
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len < 0.001) {
            this.fillCircle(x0, y0, width / 2, color);
            return;
        }
        
        const nx = -dy / len;
        const ny = dx / len;
        const half = width / 2;
        
        const p1 = { x: x0 + nx * half, y: y0 + ny * half };
        const p2 = { x: x0 - nx * half, y: y0 - ny * half };
        const p3 = { x: x1 - nx * half, y: y1 - ny * half };
        const p4 = { x: x1 + nx * half, y: y1 + ny * half };
        
        this.fillPolygon([p1, p2, p3, p4], color);
        this.fillCircle(x0, y0, half, color);
        this.fillCircle(x1, y1, half, color);
    }

    // TODO: Отрисовка контура фигуры
    strokePolygon(points: {x: number; y: number}[], color: RGBA, width = 1) {
        if (points.length < 2) return;
    
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            this.strokeLine(p1.x, p1.y, p2.x, p2.y, color, width);
        }
    }
}