import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import Header from '@/components/Header';
import Explorer from '@/pages/Explorer';
import Planner from '@/pages/Planner';
import Footer from '@/components/Footer';

export default function App() {
  return (
    <BrowserRouter basename="/course-graph">
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/explorer" replace />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/planner" element={<Planner />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
