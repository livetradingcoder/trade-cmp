import { Link } from "react-router-dom";
import logoImage from "../images/logo.png";

const Footer = () => {
  return (
    <footer className='footer'>
      <div className='section-container footer-container'>
        <div className='footer-main'>
          <div className='footer-brand'>
            <Link to='/' className='footer-logo'>
              <img src={logoImage} alt='Live Trading League' className='footer-logo-image' />
            </Link>
            <p className='footer-description'>
              Revolutionising trading competitions.
              <br />
              Prove your skills. Climb the ranks. Win real money.
            </p>
          </div>

          <div className='footer-links'>
            <div className='footer-col'>
              <h4>Ecosystem</h4>
              <ul>
                <li>
                  <Link to='/competitions'>Competitions</Link>
                </li>
                <li>
                  <a href={import.meta.env.VITE_LEADERBOARD_URL || "/leaderboard"} target='_blank' rel='noopener noreferrer'>
                    Leaderboards
                  </a>
                </li>
                <li>
                  <a href='/#goal'>Protocol</a>
                </li>
              </ul>
            </div>
            <div className='footer-col'>
              <h4>Company</h4>
              <ul>
                <li>
                  <Link to='/terms'>Terms & Privacy</Link>
                </li>
                <li>
                  <a href={import.meta.env.VITE_DISCORD_URL || "#"} target='_blank' rel='noopener noreferrer'>
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='footer-disclaimer'>
          <h4>Transparency & Risk Disclosure</h4>
          <p>
            LiveTradingLeague operates competition-based trading events. Participants trade using their own capital.
            We do not provide investment advice, manage funds, or offer brokerage services. All results are based on individual trading performance. Trading involves risk. Only trade capital you can afford to lose.
          </p>
        </div>

        <div className='footer-bottom'>
          <span>© 2026 Livetradingleague. All rights reserved.</span>
          <div className='footer-bottom-links'>
            <Link to='/risk-warning'>Risk Warning</Link>
            <Link to='/security'>Security</Link>
          </div>
        </div>
      </div>

      <style>{`
                .footer {
                    border-top: 1px solid var(--panel-border);
                    padding: 80px 24px 40px;
                    background: var(--bg-color);
                }

                .footer-container {
                    padding: 0;
                }

                .footer-main {
                    display: flex;
                    justify-content: space-between;
                    gap: 60px;
                    flex-wrap: wrap;
                }

                .footer-brand {
                    flex: 1;
                    min-width: 280px;
                    max-width: 400px;
                }

                .footer-logo {
                    display: flex;
                    align-items: center;
                    margin-bottom: 24px;
                    text-decoration: none;
                    color: inherit;
                }

                .footer-logo-image {
                    height: 36px;
                    width: auto;
                    object-fit: contain;
                }

                .footer-description {
                    color: var(--text-dim);
                    line-height: 1.8;
                    font-size: clamp(0.95rem, 1.5vw, 1.1rem);
                }

                .footer-links {
                    display: flex;
                    gap: 80px;
                    flex-wrap: wrap;
                }

                .footer-col h4 {
                    margin-bottom: 20px;
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 800;
                }

                .footer-col ul {
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .footer-col ul li a,
                .footer-col ul li span {
                    color: var(--text-dim);
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: color 0.2s;
                    cursor: pointer;
                }

                .footer-col ul li a:hover {
                    color: var(--text-main);
                }

                .footer-disclaimer {
                    margin-top: 60px;
                    padding-top: 32px;
                    border-top: 1px solid var(--panel-border);
                    max-width: 900px;
                }

                .footer-disclaimer h4 {
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                }

                .footer-disclaimer p {
                    color: var(--text-dim);
                    line-height: 1.8;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .footer-bottom {
                    margin-top: 60px;
                    padding-top: 32px;
                    border-top: 1px solid var(--panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .footer-bottom-links {
                    display: flex;
                    gap: 24px;
                }

                .footer-bottom-links a {
                    color: var(--text-muted);
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .footer-bottom-links a:hover {
                    color: var(--text-main);
                }

                @media (max-width: 768px) {
                    .footer {
                        padding: 60px 16px 32px;
                    }
                    .footer-main {
                        flex-direction: column;
                        gap: 40px;
                    }
                    .footer-brand {
                        max-width: none;
                    }
                    .footer-links {
                        gap: 40px;
                    }
                    .footer-disclaimer {
                        margin-top: 40px;
                        padding-top: 24px;
                    }
                    .footer-bottom {
                        flex-direction: column;
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 24px;
                    }
                }

                @media (max-width: 480px) {
                    .footer-links {
                        gap: 32px;
                    }
                    .footer-col {
                        min-width: 120px;
                    }
                }
            `}</style>
    </footer>
  );
};

export default Footer;
