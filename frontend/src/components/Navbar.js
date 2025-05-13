import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-100 shadow-md px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <Link to="/register" className="text-sm font-medium">Registro</Link>
        <Link to="/login" className="text-sm font-medium">Login</Link>
        {isAuthenticated && <Link to="/dashboard" className="text-sm font-medium">Dashboard</Link>}
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-sm text-gray-700">
            <FiUser size={16} />
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1 rounded hover:bg-purple-200 text-white-600 transition"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
