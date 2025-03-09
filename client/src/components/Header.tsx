import React from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming you're using AuthContext

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const { user } = useAuth(); // Get the current user from AuthContext

  return (
    <header className="main-header">
      <div className="top-nav-bg">
        <div className="top-nav">
          <div className="w-full layout-container lc-header">
            <div className="top-nav-container">
              <div className="signin-nav">
                <h3>OnTopNetwork.com</h3>
                <div className="signin-links">
                  <a href="/">Home</a> |
                  <a href="/careers">Careers</a> |
                  <a href="https://www.cityontop.com/" target="_blank" rel="noopener noreferrer">CityOnTop</a> |
                  <a href="/advertise">Advertise With Us</a> |
                  <a href="https://discord.gg/98XGDhMCUX" target="_blank" rel="noopener noreferrer">Join Our Discord</a> |
                  
                  {/* Show Portal link if the user is not signed in */}
                  {!user && (
                    <a href="/login">Portal</a> // Link to the login page
                  )}
                  {/* Optionally, you can show a Dashboard link if the user is logged in */}
                  {user && user.isAdmin === 1 && (
                    <a href="/contractor/dashboard">Dashboard</a>
                  )}
                  {user && user.isAdmin === 2 && (
                    <a href="/admin/dashboard">Dashboard</a>
                  )}
                </div>
              </div>  
            </div>  
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
