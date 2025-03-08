import React from 'react';

interface DiscordCTAProps {}

const DiscordCTA: React.FC<DiscordCTAProps> = () => {
  return (
    <div className="career-cta">
      <div className="career-text">
        <h2>Join Our Discord</h2>
        <ul>
          <li>Join the Discord today for updates, announcements, and more!</li>
        </ul>
      </div>
      <a href="https://discord.gg/98XGDhMCUX" className="discord-cta-btn" target="_blank" rel="noopener noreferrer">Join Now!</a>
    </div>
  );
};

export default DiscordCTA;
