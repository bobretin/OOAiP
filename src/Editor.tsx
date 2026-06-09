import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Square, Circle, Pen, MousePointer } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div className="flex flex-1">
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
        </aside>

        {/* Центральный холст */}
        <main className="flex-1 bg-slate-100 flex items-center justify-center p-8">
          <div className="w-full h-full max-w-4xl max-h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Здесь будет холст для рисования */}
            <div className="flex items-center justify-center h-full text-gray-400">
              Холст для рисования
            </div>
          </div>
        </main>

        {/* Правая панель (свойства) */}
        <aside className="w-64 border-l border-slate-800 bg-slate-900 p-4">
          <h3 className="text-white font-semibold mb-4">Свойства</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Цвет</label>
              <input type="color" className="w-full h-10 rounded bg-slate-700 border border-slate-600" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Толщина</label>
              <input type="range" min="1" max="20" className="w-full" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Непрозрачность</label>
              <input type="range" min="0" max="100" defaultValue="100" className="w-full" />
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}