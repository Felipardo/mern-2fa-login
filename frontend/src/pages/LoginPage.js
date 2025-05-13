import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/globalForm.css';
import { verifySignature } from '../utils/verifySignature';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {

    e.preventDefault();
    setMessage('');
    try {
const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { email, password });

      console.log('📥 Respuesta:', res.data);
      if (res.data.require2FA) {
        navigate('/select-2fa', { state: { email } });
      } else {
        // ✅ Verificación de firma digital
        const { signedMessage, signature } = res.data;
        const valid = await verifySignature(signedMessage, signature);

        if (!valid) {
          alert('❌ Firma digital inválida. Posible manipulación de datos.');
          return;
        }

        // ✅ Guardar token y datos de la firma
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('signedMessage', signedMessage);
        localStorage.setItem('signature', signature);

        navigate('/dashboard');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error al iniciar sesión');
      console.error('❌ Error de login:', err.response);

    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Iniciar sesión</h2>
      <h3 className="form-subtitle">Accede a tu cuenta con 2FA</h3>
      <form onSubmit={handleLogin}>
        <div className="textbox">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder=" "
          />
          <label>Correo electrónico</label>
        </div>

        <div className="textbox">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder=" "
          />
          <label>Contraseña</label>
        </div>

        <button type="submit">Iniciar sesión</button>
      </form>
      <p style={{ color: 'red' }}>{message}</p>
    </div>
  );
};

export default LoginPage;
