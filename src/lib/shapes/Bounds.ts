export class Bounds 
{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;

    constructor(minX: number, minY: number, maxX: number, maxY: number) 
    {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    get width(): number
    {
        return this.maxX - this.minX;
    }

    get height(): number 
    {
        return this.maxY - this.minY;
    }

    get centerX(): number 
    {
        return (this.minX + this.maxX) / 2;
    }

    get centerY(): number 
    {
        return (this.minY + this.maxY) / 2;
    }

    contains(x: number, y: number): boolean 
    {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }

    union(other: Bounds): Bounds 
    {
        const newMinX = Math.min(this.minX, other.minX);
        const newMinY = Math.min(this.minY, other.minY);
        const newMaxX = Math.max(this.maxX, other.maxX);
        const newMaxY = Math.max(this.maxY, other.maxY);
        return new Bounds(newMinX, newMinY, newMaxX, newMaxY);
    }

    static fromPoints(points: { x: number, y: number }[]): Bounds | null 
    {
        if (points.length === 0) return null;
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return new Bounds(minX, minY, maxX, maxY);
    }

    static fromCenter(centerX: number, centerY: number, width: number, height: number): Bounds
    {
        const halfW = width / 2;
        const halfH = height / 2;
        return new Bounds(centerX - halfW, centerY - halfH, centerX + halfW, centerY + halfH);
    }
}

export function createBounds(minX: number, minY: number, maxX: number, maxY: number): Bounds
{
    return new Bounds(minX, minY, maxX, maxY);
}

export function boundsContains(bounds: Bounds, x: number, y: number): boolean
{
    return bounds.contains(x, y);
}

export function boundsFromPoints(points: { x: number; y: number }[]): Bounds | null
{
    return Bounds.fromPoints(points);
}

export function boundsFromCenter(cx: number, cy: number, w: number, h: number): Bounds
{
    return Bounds.fromCenter(cx, cy, w, h);
}