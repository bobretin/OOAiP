import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  date: string;
};

export default function Gallery() {
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Мой первый проект', date: new Date().toLocaleDateString() },
    { id: '2', name: 'Тестовый проект', date: new Date().toLocaleDateString() },
  ]);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Проект ${projects.length + 1}`,
      date: new Date().toLocaleDateString(),
    };
    setProjects([...projects, newProject]);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Останавливаем переход по ссылке
    e.stopPropagation();
    setProjects(projects.filter(project => project.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Галерея проектов</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Создать проект
        </motion.button>
      </div>

      {projects.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400 text-center mt-20"
        >
          Нет проектов. Создайте первый!
        </motion.p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Link to={`/editor/${project.id}`}>
                  <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors cursor-pointer relative group">
                    <button
                      onClick={(e) => deleteProject(project.id, e)}
                      className="absolute top-3 right-3 p-2 bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                    <h3 className="text-xl font-semibold text-white pr-8">{project.name}</h3>
                    <p className="text-gray-400 text-sm mt-2">Создан: {project.date}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}