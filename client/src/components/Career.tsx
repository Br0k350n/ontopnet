import React from 'react';
import DiscordCTA from './DiscordCTA';
import AdComponent from './adPlace';

interface CareerProps {}

const Career: React.FC<CareerProps> = () => {
  return (
    <>
      <div className="w-full layout-container lc-home">
        <div className="index-layout">
          <div className="body-container">
            <main className="index-content">
              <div className="career-container">
                <div className="full-page-title">
                  <h1>Careers</h1>
                </div>
                <div className="full-page-section">
                  <div className="about-text career-text">
                    <div>
                      <p>
                        OnTopNetwork.com offers a unique opportunity for contractors looking to work on their own schedule. As a contractor with us, you’re in control of your time and can manage your workload in a way that best suits your lifestyle. This role provides you with the freedom to explore your creativity and leverage your expertise while maintaining a healthy work-life balance. With flexible hours and a supportive network, you can design a workday that aligns with your personal and professional goals.
                      </p>
                    </div>
                    <div>
                      <h2>What We Offer</h2>
                      <p>
                        Our contractor roles are structured around commission-based earnings rather than a fixed hourly rate, ensuring that your success directly influences your income. This setup encourages excellence and rewards performance with greater financial benefits. You will have access to cutting-edge tools and resources that help you track your progress and maximize your earnings, ensuring every effort translates into tangible rewards. In addition, our competitive environment fosters personal growth, while comprehensive training sessions and support systems keep you up-to-date with industry trends.
                      </p>
                    </div>
                    <div>
                      <h2>Why Contract with OnTopNetwork.com?</h2>
                      <p>
                        We value the independence of our contractors. You have the flexibility to determine your own pricing within our guidelines, giving you room to adjust rates while maintaining a balanced and fair structure. This means you can offer competitive rates while still ensuring a rewarding compensation for your hard work. Our system is designed to promote fairness and transparency, enabling you to set prices that truly reflect your expertise and experience. Furthermore, our collaborative environment means you’ll receive regular feedback and support, helping you continuously improve and reach your full potential.
                      </p>
                      <ul>
                        <li>✅ Flexible scheduling that lets you work on your own terms.</li>
                        <li>✅ Commission-based pay structure that rewards performance.</li>
                        <li>✅ Autonomy in setting competitive pricing within defined limits.</li>
                        <li>✅ An opportunity to work with a leading digital media brand and grow your professional portfolio.</li>
                      </ul>
                    </div>
                    <div>
                      <h2>Shape Your Future as a Contractor</h2>
                      <p>
                        At OnTopNetwork.com, we believe that the best work comes when you have both freedom and support. As a contractor, you’ll enjoy the benefits of flexible work arrangements and the motivation of a performance-based pay model. Join us and be part of a dynamic team where your skills are truly valued. We are committed to providing you with the tools and mentorship necessary to succeed, so together we can build a prosperous future in the digital media landscape. Our culture emphasizes collaboration and innovation, ensuring that every contractor has the opportunity to impact the company's success while building a fulfilling career.
                      </p>
                    </div>
                  </div>
                  <DiscordCTA />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Career;
