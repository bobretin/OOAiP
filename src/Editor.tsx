import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Square, Circle, Pen, MousePointer, Brush } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CanvasScene from './components/CanvasScene';
import { LineAlg } from './lib/raster/RasterRenderer';

export default function Editor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lineAlg, setLineAlg] = useState<LineAlg>('bresenham');

    const goBack = () => navigate(-1);

    const saveAndGoHome = () => {
        alert(`Проект ${id} сохранён!`);
        navigate('/');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col bg-slate-950"
        >
            {/* Верхняя панель */}
            <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    Назад
                </button>

                <h1 className="text-white font-semibold">
                    {id === 'new' ? 'Новый проект' : `Редактирование проекта №${id}`}
                </h1>

                <button
                    onClick={saveAndGoHome}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-lg transition-colors"
                >
                    <Save size={18} />
                    Сохранить
                </button>
            </header>

            {/* Основная область с панелями */}
            <div className="flex flex-1 overflow-hidden">
                {/* Левая панель (инструменты) */}
                <aside className="w-16 border-r border-slate-800 bg-slate-900 flex flex-col items-center py-4 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <MousePointer size={20} className="text-white" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <Square size={20} className="text-white" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <Circle size={20} className="text-white" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <Pen size={20} className="text-white" />
                    </motion.button>
                    
                    {/* Разделитель */}
                    <div className="w-8 h-px bg-slate-700 my-2" />
                    
                    {/* Переключатель алгоритмов линий */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setLineAlg('bresenham')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${lineAlg === 'bresenham' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                            title="Алгоритм Брезенхема (чёткие линии)"
                        >
                            <Brush size={18} className="text-white" />
                        </button>
                        <button
                            onClick={() => setLineAlg('wu')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${lineAlg === 'wu' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                            title="Алгоритм Ву (сглаженные линии)"
                        >
                            <span className="text-white text-xs font-bold">Wu</span>
                        </button>
                    </div>
                </aside>

                {/* Центральный холст - ТЕПЕРЬ ЗДЕСЬ РАСТЕРИЗАТОР */}
                <main className="flex-1 bg-slate-800 flex items-center justify-center p-4">
                    <div className="w-full h-full bg-slate-900 rounded-lg shadow-lg overflow-hidden">
                        <CanvasScene lineAlg={lineAlg} />
                    </div>
                </main>

                {/* Правая панель (свойства) */}
                <aside className="w-64 border-l border-slate-800 bg-slate-900 p-4">
                    <h3 className="text-white font-semibold mb-4">Свойства</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm block mb-2">Алгоритм линий</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLineAlg('bresenham')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${lineAlg === 'bresenham' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}`}
                                >
                                    Брезенхем
                                </button>
                                <button
                                    onClick={() => setLineAlg('wu')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${lineAlg === 'wu' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}`}
                                >
                                    Ву
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm block mb-2">Текущий режим</label>
                            <p className="text-white text-sm">
                                {lineAlg === 'bresenham' ? 'Чёткие линии (ступенчатые)' : 'Сглаженные линии (плавные)'}
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
}