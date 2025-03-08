import React from 'react';
import CookieConsent from './CookieConsent';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <>
      <footer>
          <p className="ToC-footer">
            © 2025 OnTopNetwork.com. All Rights Reserved. OnTopNetwork.com is a division of Royce Madison Media LLC and operates as the parent company of CityOnTop.com, CountyOnTop.com, and DevOnTop.com. All content, trademarks, and intellectual property featured on this website are the property of their respective owners.
        OnTopNetwork.com is not affiliated with Rockstar Games, Take-Two Interactive, Cfx.re, FiveM, or RedM. Any references to these brands are purely for informational purposes. All trademarks, logos, and game-related assets remain the property of their respective copyright holders.
        Unauthorized reproduction, distribution, or modification of any material from this site without prior written consent is strictly prohibited. 
          </p>

        <script src="/script.js?v=1.12"></script>
      </footer>
      <CookieConsent />
    </>
  );
};

export default Header;






