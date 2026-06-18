import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';
import { loadProjectIndex, ProjectMeta } from './lib/ProjectStorage';

export default function Gallery() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const index = await loadProjectIndex();
                setProjects(index);
            } catch (error) {
                console.error('Ошибка загрузки проектов:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadProjects();
    }, []);
    
    const createNewProject = () => {
        const newId = `project_${Date.now()}`;
        navigate(`/editor/${newId}`);  // ← используем navigate вместо window.location
    };
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                Загрузка проектов...
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Мои проекты</h1>
                    <button
                        onClick={createNewProject}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        Создать проект
                    </button>
                </div>
                
                {projects.length === 0 ? (
                    <div className="text-center py-20">
                        <FolderOpen size={64} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">Нет сохранённых проектов</p>
                        <p className="text-gray-500 text-sm mt-2">Создайте первый проект, нажав кнопку выше</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <motion.div
                                key={project.id}
                                whileHover={{ scale: 1.02, y: -4 }}
                                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-all"
                            >
                                <Link to={`/editor/${project.id}`}>
                                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        ID: {project.id}
                                    </p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}