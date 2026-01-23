import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import RequireAuth from './auth/RequireAuth';

import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportGarbage from './pages/ReportGarbage';
import MyReports from './pages/MyReports';
import AdminDashboard from './pages/AdminDashboard';
import AdminCreateUser from './pages/AdminCreateUser';
import CleanerDashboard from './pages/CleanerDashboard';
import Rewards from './pages/Rewards';
import About from './pages/About';
import NotFound from './pages/NotFound';

import './App.css';

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 260);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="app">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/citizen"
            element={
              <RequireAuth roles={["citizen"]}>
                <CitizenDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/report"
            element={
              <RequireAuth roles={["citizen"]}>
                <ReportGarbage />
              </RequireAuth>
            }
          />
          <Route
            path="/my-reports"
            element={
              <RequireAuth roles={["citizen"]}>
                <MyReports />
              </RequireAuth>
            }
          />
          <Route
            path="/rewards"
            element={
              <RequireAuth roles={["citizen"]}>
                <Rewards />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth roles={["admin"]}>
                <AdminDashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/admin/create-user"
            element={
              <RequireAuth roles={["admin"]}>
                <AdminCreateUser />
              </RequireAuth>
            }
          />

          <Route
            path="/cleaner"
            element={
              <RequireAuth roles={["cleaner"]}>
                <CleanerDashboard />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <button
        type="button"
        className={`scroll-top-btn${showScrollTop ? ' show' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        ↑
      </button>
      <Footer />
    </div>
  );
}
