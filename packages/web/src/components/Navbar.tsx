import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Menu, X } from "lucide-react";
import logoImage from "../images/logo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const leaderboardUrl = import.meta.env.VITE_LEADERBOARD_URL || "/leaderboard";

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/competitions", label: "Competitions" },
    { path: leaderboardUrl, label: "Leaderboard", isExternal: !leaderboardUrl.startsWith("/") },
    { path: "/terms", label: "Terms & Privacy", isHash: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          {/* Logo */}
          <Link to='/' className='navbar-logo'>
            <img src={logoImage} alt='Live Trading League' className='logo-image' />
          </Link>

          {/* Desktop Navigation */}
          <div className='navbar-desktop'>
            <div className='nav-links'>
              {navLinks.map((link) =>
                link.isHash ? (
                  <a key={link.path} href={link.path} className='nav-link'>
                    {link.label}
                  </a>
                ) : link.isExternal ? (
                  <a key={link.path} href={link.path} target='_blank' rel='noopener noreferrer' className='nav-link'>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? "active" : ""}`}>
                    {link.label}
                  </Link>
                )
              )}
            </div>

            <div className='nav-divider' />

            <div className='nav-buttons'>
              <button onClick={() => navigate("/admin")} className='btn-outline'>
                <ShieldCheck size={18} /> Portal
              </button>
              <Link to='/competitions'>
                <button className='btn-primary'>Get Started</button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className='mobile-menu-btn' onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className='mobile-menu open'>
          <div className='mobile-menu-content'>
            {navLinks.map((link) =>
              link.isHash ? (
                <a key={link.path} href={link.path} className='mobile-nav-link' onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </a>
              ) : link.isExternal ? (
                <a
                  key={link.path}
                  href={link.path}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mobile-nav-link'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${isActive(link.path) ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className='mobile-nav-buttons'>
              <button
                onClick={() => {
                  navigate("/admin");
                  setMobileMenuOpen(false);
                }}
                className='btn-outline'
                style={{ width: "100%" }}
              >
                <ShieldCheck size={18} /> Portal
              </button>
              <Link to='/competitions' style={{ width: "100%" }} onClick={() => setMobileMenuOpen(false)}>
                <button className='btn-primary' style={{ width: "100%" }}>
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .navbar {
          padding: 16px 24px;
          display: flex;
          justify-content: center;
          margin-top: 44px;
          background: rgba(2, 2, 3, 0.9);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 44px;
          z-index: 100;
          border-bottom: 1px solid var(--panel-border);
        }

        .navbar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1340px;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }

        .logo-image {
          height: 56px;
          width: auto;
          object-fit: contain;
        }

        .navbar-desktop {
          display: flex;
          gap: 40px;
          align-items: center;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          color: var(--text-dim);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: color 0.2s;
          position: relative;
        }

        .nav-link:hover,
        .nav-link.active {
          color: var(--text-main);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary);
          border-radius: 1px;
        }

        .nav-divider {
          height: 24px;
          width: 1px;
          background: var(--panel-border);
        }

        .nav-buttons {
          display: flex;
          gap: 16px;
        }

        .nav-buttons a {
          text-decoration: none;
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          padding: 8px;
        }

        .mobile-menu {
          display: none;
          position: fixed;
          top: calc(44px + 73px);
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-color);
          z-index: 99;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-menu.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-menu-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mobile-nav-link {
          color: var(--text-dim);
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          padding: 16px 0;
          border-bottom: 1px solid var(--panel-border);
          transition: color 0.2s;
        }

        .mobile-nav-link:hover,
        .mobile-nav-link.active {
          color: var(--text-main);
        }

        .mobile-nav-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .mobile-nav-buttons a {
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .navbar-desktop {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .mobile-menu {
            display: block;
            top: calc(36px + 57px);
          }

          .logo-image {
            height: 40px;
          }

          .navbar {
            padding: 12px 16px;
            margin-top: 36px;
            top: 36px;
          }
        }

        @media (max-width: 480px) {
          .logo-image {
            height: 34px;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
