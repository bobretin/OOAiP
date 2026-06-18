import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { Shape } from './shapes/Shape';
import { Rect } from './shapes/Rect';
import { Line } from './shapes/Line';
import { Oval } from './shapes/Oval';
import { Triangle } from './shapes/Triangle';
import { QuadraticBezier } from './shapes/QuadraticBezier';
import { CubicBezier } from './shapes/CubicBezier';
import { PathBezier } from './shapes/PathBezier';

const PROJECTS_DIR = 'VectorEngine/projects';
const INDEX_FILE = 'index.json';

export interface ProjectMeta {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectData {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    lineAlg: string;
    shapes: any[];
}

// ========== СОХРАНЕНИЕ ПРОЕКТА ==========
export async function saveProject(id: string, name: string, lineAlg: string, shapes: Shape[]): Promise<void> {
    try {
        // Создаём папку для проектов, если её нет
        await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
        
        // Формируем данные проекта
        const now = new Date().toISOString();
        const projectData: ProjectData = {
            id,
            name,
            createdAt: now,
            updatedAt: now,
            lineAlg,
            shapes: shapes.map(s => s.toJSON()),
        };
        
        // Сохраняем проект в файл
        const filePath = `${PROJECTS_DIR}/${id}.json`;
        await writeTextFile(filePath, JSON.stringify(projectData, null, 2), {
            baseDir: BaseDirectory.Document,
        });
        
        // Обновляем индекс
        await updateIndex(id, name, now);
        
        console.log(`Проект ${name} сохранён в ${filePath}`);
    } catch (error) {
        console.error('Ошибка сохранения проекта:', error);
        throw error;
    }
}

// ========== ЗАГРУЗКА ПРОЕКТА ==========
export async function loadProject(id: string): Promise<ProjectData | null> {
    try {
        const filePath = `${PROJECTS_DIR}/${id}.json`;
        const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
        const data: ProjectData = JSON.parse(content);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки проекта:', error);
        return null;
    }
}

// ========== ЗАГРУЗКА СПИСКА ПРОЕКТОВ ==========
export async function loadProjectIndex(): Promise<ProjectMeta[]> {
    try {
        // Создаём папку, если её нет
        await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
        
        const filePath = `${PROJECTS_DIR}/${INDEX_FILE}`;
        const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
        const index: ProjectMeta[] = JSON.parse(content);
        return index;
    } catch (error) {
        // Если файла индекса нет — возвращаем пустой массив
        return [];
    }
}

// ========== ОБНОВЛЕНИЕ ИНДЕКСА ==========
async function updateIndex(id: string, name: string, timestamp: string): Promise<void> {
    try {
        const index = await loadProjectIndex();
        
        // Обновляем или добавляем запись
        const existing = index.find(p => p.id === id);
        if (existing) {
            existing.name = name;
            existing.updatedAt = timestamp;
        } else {
            index.push({
                id,
                name,
                createdAt: timestamp,
                updatedAt: timestamp,
            });
        }
        
        // Сохраняем индекс
        const filePath = `${PROJECTS_DIR}/${INDEX_FILE}`;
        await writeTextFile(filePath, JSON.stringify(index, null, 2), {
            baseDir: BaseDirectory.Document,
        });
    } catch (error) {
        console.error('Ошибка обновления индекса:', error);
    }
}

// ========== ВОССТАНОВЛЕНИЕ ФИГУР ИЗ JSON ==========
export function shapeFromJSON(data: any): Shape | null {
    try {
        const type = data.type;
        let shape: Shape | null = null;
        
        switch (type) {
            case 'Rect':
                shape = new Rect(data.w || 100, data.h || 100);
                break;
                
            case 'Line':
                shape = new Line(data.x1 || 0, data.y1 || 0, data.x2 || 100, data.y2 || 0);
                break;
                
            case 'Oval':
                shape = new Oval(data.rx || 50, data.ry || 30);
                break;
                
            case 'Triangle':
                shape = new Triangle(
                    data.p1 || { x: 0, y: -60 },
                    data.p2 || { x: -75, y: 60 },
                    data.p3 || { x: 75, y: 60 }
                );
                break;
                
            case 'QuadraticBezier':
                shape = new QuadraticBezier(
                    data.p0?.x || 0, data.p0?.y || 0,
                    data.p1?.x || 50, data.p1?.y || -50,
                    data.p2?.x || 100, data.p2?.y || 0
                );
                if (data.closed !== undefined) (shape as any).closed = data.closed;
                break;
                
            case 'CubicBezier':
                shape = new CubicBezier(
                    data.p0?.x || 0, data.p0?.y || 0,
                    data.p1?.x || 33, data.p1?.y || -50,
                    data.p2?.x || 66, data.p2?.y || 50,
                    data.p3?.x || 100, data.p3?.y || 0
                );
                if (data.closed !== undefined) (shape as any).closed = data.closed;
                break;
                
            case 'PathBezier':
                const path = new PathBezier(data.mode || 'polyline', data.closed || false);
                if (data.points) {
                    for (const p of data.points) {
                        path.addPointLocal(p.x, p.y);
                    }
                }
                shape = path;
                break;
                
            default:
                console.warn(`Неизвестный тип фигуры: ${type}`);
                return null;
        }
        
        if (shape) {
            // Восстанавливаем трансформацию
            if (data.transform) {
                shape.transform.x = data.transform.x || 0;
                shape.transform.y = data.transform.y || 0;
                shape.transform.rotation = data.transform.rotation || 0;
                shape.transform.scaleX = data.transform.scaleX || 1;
                shape.transform.scaleY = data.transform.scaleY || 1;
            }
            
            // Восстанавливаем стили
            shape.fillStyle = data.fillStyle || '#000000';
            shape.fillOpacity = data.fillOpacity || 1;
            shape.strokeStyle = data.strokeStyle || '#000000';
            shape.strokeWidth = data.strokeWidth || 1;
            shape.strokeOpacity = data.strokeOpacity || 1;
        }
        
        return shape;
    } catch (error) {
        console.error('Ошибка восстановления фигуры:', error);
        return null;
    }
}