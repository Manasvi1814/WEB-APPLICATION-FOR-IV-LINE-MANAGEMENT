import React from 'react';

import { useNavigate } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to the Hospital Dashboard</h1>
      <p className="text-gray-700 mb-6 text-center">
        Please select your department and log in to access the system.
      </p>
      <button
        onClick={goToLogin}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go to Login
      </button>
    </div>
  );
};

export default WelcomePage;