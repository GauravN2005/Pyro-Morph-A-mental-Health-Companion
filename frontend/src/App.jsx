import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage       from './pages/HomePage';
import ChatPage       from './pages/ChatPage';
import VideoCallPage  from './pages/VideoCallPage';
import VoicePage      from './pages/VoicePage';
import MoodPage       from './pages/MoodPage';
import SettingsPage   from './pages/SettingsPage';

const pv = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

const P = ({ children }) => (
  <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

function InnerRoutes() {
  const location = useLocation();
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/home"     element={<P><HomePage /></P>} />
            <Route path="/chat"     element={<P><ChatPage /></P>} />
            <Route path="/video"    element={<P><VideoCallPage /></P>} />
            <Route path="/voice"    element={<P><VoicePage /></P>} />
            <Route path="/mood"     element={<P><MoodPage /></P>} />
            <Route path="/settings" element={<P><SettingsPage /></P>} />
          </Routes>
        </AnimatePresence>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AllRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname === '/' ? 'land' : 'app'}>
        <Route path="/"            element={<P><LandingPage /></P>} />
        <Route path="/login"       element={<P><LoginPage /></P>} />
        <Route path="/onboarding"  element={
          <ProtectedRoute><P><OnboardingPage /></P></ProtectedRoute>
        } />
        <Route path="/*" element={<InnerRoutes />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AllRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
