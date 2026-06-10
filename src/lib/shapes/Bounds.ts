export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export function createBounds(minX: number, minY: number, maxX: number, maxY: number): Bounds {
    return { minX, minY, maxX, maxY };
}

export function boundsContains(bounds: Bounds, x: number, y: number): boolean {
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

export function boundsFromPoints(points: { x: number; y: number }[]): Bounds {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
}

export function boundsFromCenter(cx: number, cy: number, halfW: number, halfH: number): Bounds {
    return { minX: cx - halfW, minY: cy - halfH, maxX: cx + halfW, maxY: cy + halfH };
}