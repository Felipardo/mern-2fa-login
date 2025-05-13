import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/globalForm.css';

const VerifyRegisterCodePage = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('pending-email');
    const password = localStorage.getItem('pending-password');
    const enable2FA = localStorage.getItem('pending-2fa') === '1';

    try {
const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register-verify`, {
        email,
        code,
        password,
        enable2FA
      });

      setMessage(res.data.message);
      localStorage.removeItem('pending-email');
      localStorage.removeItem('pending-password');
      localStorage.removeItem('pending-2fa');

      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Código inválido.');
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Verifica tu correo</h2>
      <h3 className="form-subtitle">Introduce el código que recibiste</h3>
      <form onSubmit={handleVerify}>
        <div className="textbox">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder=" "
          />
          <label>Código de verificación</label>
        </div>
        <button type="submit">Verificar</button>
      </form>
      {message && <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>}
    </div>
  );
};

export default VerifyRegisterCodePage;
