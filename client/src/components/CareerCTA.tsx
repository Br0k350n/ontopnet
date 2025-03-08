import React from 'react';

interface HeaderProps {}

const CareerCTA: React.FC<HeaderProps> = () => {
  return (
    <>
      <div className="career-cta">
        <div className="career-text">
          <h2>We Are Hiring</h2>
          <ul>
            <li>Earn commissions and bonuses</li>
            <li>Work on your own schedule</li>
            <li>Help grow FiveM &amp; RedM communities</li>
            <li>Be part of a fast-growing gaming network</li>
          </ul>
        </div>
        <a href="/career" className='career-cta-btn'>Apply Today!</a>
      </div>
    </>
  );
};

export default CareerCTA;
