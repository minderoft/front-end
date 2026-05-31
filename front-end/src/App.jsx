// filepath: front-end/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import CreateAnnouncement from './pages/CreateAnnouncement';
import CreateAd from './pages/CreateAd';
import Tarifs from './pages/Tarifs';
import Dashboard from './pages/Dashboard';
import AdvertiserDashboard from './pages/AdvertiserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPricing from './pages/AdminPricing';
import Login from './pages/Login';
import Register from './pages/Register';
import Help from './pages/Help';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import About from './pages/About';
import Legal from './pages/Legal';
import Chat from './pages/Chat';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Success from './pages/Success';
import PaymentError from './pages/PaymentError';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  console.log('App component loaded');
  return (
    <div className="app">
      <Navbar />
      <main className="main-content pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail />} />
          <Route path="/tarifs" element={<Tarifs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/success" element={<Success />} />
          <Route path="/payment-error" element={<PaymentError />} />
          
          {/* Routes protégées */}
          <Route path="/create" element={
            <ProtectedRoute>
              <CreateAnnouncement />
            </ProtectedRoute>
          } />
          <Route path="/create-ad" element={
            <ProtectedRoute>
              <CreateAd />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/ads" element={
            <ProtectedRoute>
              <AdvertiserDashboard />
            </ProtectedRoute>
          } />
          
          {/* Routes admin */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/pricing" element={
            <ProtectedRoute>
              <AdminPricing />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;