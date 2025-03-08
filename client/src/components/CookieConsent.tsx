import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [cookieConsent, setCookieConsent] = useState<boolean>(false);

  // Check if the user has already accepted cookies
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'true') {
      setCookieConsent(true);
    }
  }, []);

  // Function to set the cookie consent in localStorage and document.cookie
  const handleAccept = () => {
    // Set a cookie that expires in 1 year
    document.cookie = "cookieConsent=true; max-age=" + 60 * 60 * 24 * 365; // 1 year expiration

    // Store the consent status in localStorage to avoid showing the banner again
    localStorage.setItem('cookieConsent', 'true');
    setCookieConsent(true);
  };

  // If consent is already given, don't show the banner
  if (cookieConsent) return null;

  return (
    <div
      id="cookie-warning"
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
      }}
    >
      <p>
        This website uses cookies to ensure you get the best experience.{' '}
        <a href="/privacy-policy" style={{ color: '#ddd' }} target="_blank" rel="noopener noreferrer">
          Learn more
        </a>.
      </p>
      <button
        id="accept-cookies"
        onClick={handleAccept}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '5px 10px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Accept
      </button>
    </div>
  );
};

export default CookieConsent;
