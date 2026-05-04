// filepath: front-end/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import CreateAnnouncement from './pages/CreateAnnouncement';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Help from './pages/Help';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Routes protégées */}
          <Route path="/create" element={
            <ProtectedRoute>
              <CreateAnnouncement />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;