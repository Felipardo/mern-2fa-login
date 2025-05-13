import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Select2FAMethodPage from './pages/Select2FAMethodPage'; 
import Verify2FAEmailPage from './pages/Verify2FAEmailPage';
import Verify2FAQrPage from './pages/Verify2FAQrPage';
import VerifyRegisterCodePage from './pages/VerifyRegisterCodePage';


function App() {
  return (
    <Router>
      <Navbar />
      <main className="pt-20"> {/* Espacio para el navbar fijo */}
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-2fa" element={<Select2FAMethodPage />} />
          <Route path="/verify-2fa-email" element={<Verify2FAEmailPage />} />
          <Route path="/verify-2fa-qr" element={<Verify2FAQrPage />} />
          <Route path="/verify-register" element={<VerifyRegisterCodePage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
