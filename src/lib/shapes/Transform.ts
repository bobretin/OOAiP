export interface Transform {
    x: number;      // смещение по X
    y: number;      // смещение по Y
    rotation: number; // поворот в радианах
    scaleX: number;   // масштаб по X
    scaleY: number;   // масштаб по Y
}

export function createTransform(
    x: number = 0,
    y: number = 0,
    rotation: number = 0,
    scaleX: number = 1,
    scaleY: number = 1
): Transform {
    return { x, y, rotation, scaleX, scaleY };
}

export function identityTransform(): Transform {
    return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
}