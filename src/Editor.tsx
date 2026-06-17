import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import EditorCanvas from './components/EditorCanvas';  // ← изменен импорт

export default function Editor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

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
            <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0">
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

            {/* Основная область с холстом */}
            <main className="flex-1 overflow-hidden">
                <EditorCanvas />  {/* ← вместо CanvasScene */}
            </main>
        </motion.div>
    );
}