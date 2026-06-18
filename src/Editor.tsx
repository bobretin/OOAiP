// src/Editor.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import EditorCanvas from './components/EditorCanvas';
import { saveProject, loadProject, shapeFromJSON } from './lib/ProjectStorage';
import { Shape } from './lib/shapes/Shape';

export default function Editor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [projectName, setProjectName] = useState<string>('');
    const [lineAlg, setLineAlg] = useState<string>('bresenham');
    const [shapes, setShapes] = useState<any[]>([]);
    const [initialShapes, setInitialShapes] = useState<Shape[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    
    // Загрузка проекта при открытии
    useEffect(() => {
        const loadProjectData = async () => {
            if (!id || id === 'new') {
                setIsLoading(false);
                setProjectName('Новый проект');
                setInitialShapes(undefined);
                setShapes([]);
                return;
            }
            
            try {
                const data = await loadProject(id);
                if (data) {
                    setProjectName(data.name);
                    setLineAlg(data.lineAlg || 'bresenham');
                    
                    // Восстанавливаем фигуры
                    const restoredShapes = data.shapes
                        .map((s: any) => shapeFromJSON(s))
                        .filter((s: any) : s is Shape => s !== null);

                    setInitialShapes(restoredShapes);
                    setShapes(restoredShapes);
                } else {
                    setProjectName('Новый проект');
                    setInitialShapes(undefined);
                }
            } catch (error) {
                console.error('Ошибка загрузки проекта:', error);
                setProjectName('Новый проект');
                setInitialShapes(undefined);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadProjectData();
    }, [id]);
    
    const goBack = () => navigate('/');
    
    const handleSave = async () => {
        try {
            await saveProject(
                id || 'new',
                projectName,
                lineAlg,
                shapes
            );
            alert('Проект сохранён!');
        } catch (error) {
            alert('Ошибка сохранения проекта');
            console.error(error);
        }
    };
    const handleShapesChange = (newShapes: Shape[]) => {
        setShapes(newShapes);
    };
    
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
                Загрузка...
            </div>
        );
    }
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col bg-slate-950"
        >
            {/* Верхняя панель */}
            <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0">
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    Назад
                </button>
                
                <h1 className="text-white font-semibold">
                    {id === 'new' ? 'Новый проект' : projectName}
                </h1>
                
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-lg transition-colors"
                >
                    <Save size={18} />
                    Сохранить
                </button>
            </header>
            
            {/* Холст */}
            <main className="flex-1 overflow-hidden">
                <EditorCanvas 
                    onShapesChange={handleShapesChange}
                    initialShapes={initialShapes}
                />
            </main>
        </motion.div>
    );
}