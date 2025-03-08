import React from 'react';
import CareerCTA from './CareerCTA';
import AdComponent from './adPlace';

interface HomeProps {
}

const Home: React.FC<HomeProps> = () => {
  return (
    <>

      <div className="w-full layout-container lc-home">
        <div className="index-layout">
          <div className="body-container">
            <main className="index-content">
              <div className="content-container">
                <div className="about-section">
                  <div className="about-text">
                    <div className="about-title">
                      <div
                        className="welcome-img-container"
                        style={{ backgroundImage: "url('./imgs/otn_servers/OTN.webp')" }}
                      ><img src="./imgs/otn_servers/OTN.webp" alt="" className='welcome-img'/></div>
                      <h1>OnTopNetwork.com</h1>
                    </div>
                    <div>
                      <p>
                        OnTopNetwork.com is a leading digital media brand under Royce Madison Media LLC, specializing in gaming communities, server listings, and game development support. As the parent company of CityOnTop.com, CountyOnTop.com, and DevOnTop.com, OnTopNetwork.com is dedicated to helping server owners, modders, and developers succeed in the ever-evolving world of online gaming.
                      </p>
                    </div>
                    <div>
                      <h2>What We Do</h2>
                      <p>
                        At OnTopNetwork.com, we provide high-quality digital marketing solutions, community-building resources, and cutting-edge tools to ensure that FiveM and RedM server owners, game modders, and developers receive the exposure and engagement they need. Our platforms are specifically designed to bridge the gap between gamers looking for the best online experiences and server owners who want to grow their communities.
                      </p>
                    </div>
                    <div>
                      <h2>Why Choose OnTopNetwork.com?</h2>
                      <p>
                        We understand that gaming communities, modding projects, and server hosting require more than just exposure—they require the right tools and strategies to thrive. That’s why OnTopNetwork.com offers:
                      </p>
                      <ul>
                        <li>✅ SEO-optimized server listings to increase visibility and player engagement.</li>
                        <li>✅ VIP listings and advertising options to help servers stand out from the competition.</li>
                        <li>✅ Marketing solutions tailored to server owners and game developers, ensuring that their projects receive the right exposure.</li>
                        <li>✅ A strong developer and modding community, connecting creative minds who build the worlds behind FiveM, RedM, and other open-world gaming experiences.</li>
                      </ul>
                    </div>
                    <div>
                      <h2>The Future of Gaming &amp; Development Starts Here</h2>
                      <p>
                        OnTopNetwork.com is more than just a network of gaming platforms—it’s a hub for innovation, creativity, and community-driven success. Whether you're a server owner looking to attract more players, a modder seeking new opportunities, or a game developer aiming to showcase your latest project, OnTopNetwork.com is your ultimate resource for growth and visibility in the gaming industry.
                      </p>
                    </div>
                  </div>
                  <CareerCTA />
                </div>

                {/* New Section for City On Top, Dev On Top, and County On Top */}
                <div className="top-network-section">
                  <div className="platforms-row">
                    <div className="platform-card">
                      <a href="https://www.cityontop.com/">
                        <div
                          className="platform-img"
                          style={{ backgroundImage: "url('./imgs/otn_servers/cityontop.webp')" }}
                        ></div>
                        <div className="platform-about">
                          <p>
                            CityOnTop.com is the premier listing platform for FiveM servers, helping server owners attract players and grow their communities. With customizable listings, VIP listings, and an intuitive search system, CityOnTop.com ensures your server gets the visibility it deserves. Whether you run a serious roleplay community, an action-packed freeroam server, or a modded experience, CityOnTop.com connects you with the right audience. Optimize your FiveM server's exposure today and climb to the top of the rankings!
                          </p>
                          <div
                            className="platform-about-img"
                            style={{ backgroundImage: "url('./imgs/otn_servers/cityontop_bg.webp')" }}
                          ></div>
                        </div>
                      </a>
                    </div>
                    <div className="platform-card">
                      <a href="https://www.cityontop.com/">
                        <div
                          className="platform-img"
                          style={{ backgroundImage: "url('./imgs/otn_servers/countyontop.webp')" }}
                        ></div>
                        <div className="platform-about">
                          <p>
                            CountyOnTop.com is the go-to platform for discovering and promoting RedM servers, catering to the passionate Red Dead Redemption roleplay community. Whether you're a server owner looking to attract players or a gamer searching for the best immersive Wild West experience, CountyOnTop.com helps you find the perfect match. With ranked server listings, VIP Listings, and detailed server descriptions, your RedM server can stand out in the competitive frontier.
                          </p>
                          <div
                            className="platform-about-img"
                            style={{ backgroundImage: "url('./imgs/otn_servers/countyontop_bg.webp')" }}
                          ></div>
                        </div>
                      </a>
                    </div>
                    <div className="platform-card">
                      <a href="https://www.cityontop.com/">
                        <div
                          className="platform-img"
                          style={{ backgroundImage: "url('./imgs/otn_servers/devontop.webp')" }}
                        ></div>
                        <div className="platform-about">
                          <p>
                          DevOnTop.com is the hub for game developers, modders, and creators who bring virtual worlds to life. Whether you're building expansive open-world environments, developing custom mods for FiveM and RedM, or looking for resources and tutorials, DevOnTop.com is your ultimate destination. Connect with like-minded developers, showcase your projects, and stay ahead in the ever-evolving world of game development.
                          </p>
                          <div
                            className="platform-about-img"
                            style={{ backgroundImage: "url('./imgs/otn_servers/devontop_bg.webp')" }}
                          ></div>
                        </div>
                      </a>
                    </div>

                  </div>
                  <AdComponent />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

    </>
  );
};

export default Home;
