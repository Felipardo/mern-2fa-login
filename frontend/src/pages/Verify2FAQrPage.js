import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/globalForm.css';
import { useAuth } from '../context/AuthContext';
import { verifySignature } from '../utils/verifySignature';

const Verify2FAQrPage = () => {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  const { login } = useAuth(); // ✅ usar login del contexto

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-2fa', {
        email,
        token
      });

      const { token: jwtToken, signedMessage, signature } = res.data;

      const valid = await verifySignature(signedMessage, signature);
      if (!valid) {
        alert('❌ Firma digital inválida. Posible manipulación.');
        return;
      }

      // Guardar en localStorage
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('signedMessage', signedMessage);
      localStorage.setItem('signature', signature);

      login(jwtToken); // ✅ actualizar contexto
      navigate('/dashboard'); // ✅ redirigir

    } catch (err) {
      setMessage(err.response?.data?.message || 'Código incorrecto');
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Verificación por código QR</h2>
      <h3 className="form-subtitle">Ingresa el código generado por tu app de autenticación</h3>

      <form onSubmit={handleSubmit}>
        <div className="textbox">
          <input
            type="text"
            placeholder=" "
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <label>Código de verificación</label>
        </div>

        <button type="submit">Verificar</button>
      </form>

      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
};

export default Verify2FAQrPage;
