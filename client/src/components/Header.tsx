import React from 'react';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <>
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
                    <a href="https://www.countyon-top.com/" target="_blank" rel="noopener noreferrer">CountyOnTop</a> | 
                    <a href="https://www.devontop.com/" target="_blank" rel="noopener noreferrer">DevOnTop</a> | 
                    <a href="/advertise">Advertise With Us</a> | 
                    <a href="https://discord.gg/YOUR_DISCORD_INVITE" target="_blank" rel="noopener noreferrer">Join Our Discord</a>
                  </div>
                </div>
              </div>  
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
