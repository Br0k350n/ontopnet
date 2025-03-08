import React from 'react';
import DiscordCTA from './DiscordCTA';
import AdComponent from './adPlace';

interface AdvertiseProps {}

const Advertise: React.FC<AdvertiseProps> = () => {
  return (
    <>
      <div className="w-full layout-container lc-home">
        <div className="index-layout">
          <div className="body-container">
            <main className="index-content">
              <div className="career-container">
                <div className="full-page-title">
                  <h1>Advertise</h1>
                </div>
                <div className="full-page-section">
                  <div className="about-text career-text">
                    <div>
                      <p>
                        OnTopNetwork.com offers unparalleled advertising opportunities for brands and businesses seeking to expand their reach. Our platform connects you with a highly engaged audience, enabling you to showcase your products and services in a dynamic digital environment.
                      </p>
                    </div>
                    <div>
                      <h2>What We Offer</h2>
                      <p>
                        Our advertising solutions are designed to be flexible and effective, providing a variety of formats and placements to suit your marketing objectives. Whether you’re interested in banner ads, sponsored content, or targeted campaigns, we equip you with advanced tools and data-driven insights to maximize your return on investment. Enjoy competitive pricing and customizable options that ensure your brand stands out.
                      </p>
                    </div>
                    <div>
                      <h2>Why Advertise with OnTopNetwork.com?</h2>
                      <p>
                        We understand that every brand has unique needs, which is why our platform offers tailored advertising opportunities. You have the flexibility to craft campaigns that align with your budget and target the audience most likely to engage with your message. Our transparent system and dedicated support team are committed to helping you optimize your ad spend and achieve measurable results.
                      </p>
                      <ul>
                        <li>✅ Strategic ad placements across multiple digital channels.</li>
                        <li>✅ Customizable campaigns to meet your specific business goals.</li>
                        <li>✅ Access to detailed analytics and performance metrics.</li>
                        <li>✅ A supportive team focused on driving your brand's success.</li>
                      </ul>
                    </div>
                    <div>
                      <h2>Shape Your Brand's Future</h2>
                      <p>
                        At OnTopNetwork.com, we believe that effective advertising is the cornerstone of business growth. By partnering with us, you'll benefit from innovative marketing strategies, valuable industry insights, and a collaborative approach that positions your brand at the forefront of the digital landscape. Join our network today and unlock the full potential of your brand.
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

export default Advertise;
