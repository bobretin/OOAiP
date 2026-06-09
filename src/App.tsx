import { HashRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Gallery from './Gallery';
import Editor from './Editor';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </AnimatePresence>
      </div>
    </HashRouter>
  );
}

export default App;