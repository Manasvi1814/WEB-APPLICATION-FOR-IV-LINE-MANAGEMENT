import React from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomePage.css";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="welcome-container">
      <div className="overlay">
        <div className="welcome-card">
          {/* MGM Logo in glass card */}
          <img
            src="/assests/mgm_logo_original-removebg-preview.png"
            alt="MGM Hospital Logo"
            className="hospital-logo card-logo"
          />

          <h1 className="welcome-title">
            MGM Hospital Vashi Dashboard
          </h1>

          <p className="welcome-text">
            Welcome to the Hospital IV Management System.
            Please login to access the dashboard.
          </p>

          <button className="login-button" onClick={goToLogin}>
            Go to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default WelcomePage;