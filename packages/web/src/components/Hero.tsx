import { motion } from "framer-motion";
import { Gamepad2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ASSETS } from "../constants";

const HERO_VIDEO_BASE_OPACITY = 0.65;
const HERO_VIDEO_CROSSFADE_SECONDS = 0.4;

const Hero = () => {
  const heroVideoARef = useRef<HTMLVideoElement>(null);
  const heroVideoBRef = useRef<HTMLVideoElement>(null);

  // The source video's last frame doesn't match its first, so a plain loop
  // flashes at the seam. Two copies of the same video play in parallel, offset
  // so one is always at full opacity while the other crossfades in behind it —
  // there's never a dip to the background, so it loops forever with no flash.
  useEffect(() => {
    const a = heroVideoARef.current;
    const b = heroVideoBRef.current;
    if (!a || !b) return;

    let active = a;
    let standby = b;
    let standbyStarted = false;

    active.style.opacity = String(HERO_VIDEO_BASE_OPACITY);
    standby.style.opacity = "0";
    standby.pause();
    standby.currentTime = 0;
    active.play().catch(() => {});

    let rafId: number;
    const tick = () => {
      if (active.duration) {
        const remaining = active.duration - active.currentTime;

        if (remaining <= HERO_VIDEO_CROSSFADE_SECONDS) {
          if (!standbyStarted) {
            standby.currentTime = 0;
            standby.play().catch(() => {});
            standbyStarted = true;
          }
          const fadeProgress = 1 - remaining / HERO_VIDEO_CROSSFADE_SECONDS;
          active.style.opacity = String(HERO_VIDEO_BASE_OPACITY * (1 - fadeProgress));
          standby.style.opacity = String(HERO_VIDEO_BASE_OPACITY * fadeProgress);
        } else {
          active.style.opacity = String(HERO_VIDEO_BASE_OPACITY);
          standby.style.opacity = "0";
        }

        if (active.currentTime >= active.duration - 0.02) {
          active.pause();
          active.currentTime = 0;
          const swap = active;
          active = standby;
          standby = swap;
          standbyStarted = false;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section className='hero-section'>
      <div className='bg-glow-top'></div>
      <div className='bg-grid'></div>

      <div className='section-container hero-container' >
        <div className='hero-content' style={{marginTop:"50px"}}>
          <div  className='hero-text'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className='hero-badge'>Real Competition. Real Rewards.</span>
              <h1 className='text-gradient hero-title'>
                Trade. Compete. <br /> Win Real Money.
              </h1>
              <p className='hero-description'>No funded accounts. No profit splits.</p>

              <div className='hero-cta'>
                <Link to='/competitions'>
                  <button className='btn-primary hero-btn'>
                    <Gamepad2 size={24} /> Enter the competition
                  </button>
                </Link>
             
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className='hero-bullets'
              >
                <div className='hero-bullet-row'>
                  {["Trade with your own capital", "Keep 100% of your profits",'Win real money — not demo points'].map((text, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + index * 0.08 }}
                      className='hero-bullet-item'
                    >
                      <div className='bullet-checkmark'>
                        <Check size={14} color='#fff' />
                      </div>
                      <span className='bullet-text'>{text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className='hero-visual'>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className='hero-visual-inner'
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div className='hero-image-container'>
                <motion.div
                  animate={{
                    y: [0, -12, 0],
                    rotate: [0, 1, 0, -1, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className='hero-video-stage'
                >
                  <video
                    ref={heroVideoARef}
                    src={ASSETS.HERO_VIDEO}
                    className='hero-image hero-video-layer'
                    muted
                    playsInline
                  />
                  <video
                    ref={heroVideoBRef}
                    src={ASSETS.HERO_VIDEO}
                    className='hero-image hero-video-layer'
                    muted
                    playsInline
                  />
                </motion.div>
              </div>

              {/* Stats Grid Embedded */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className='hero-stats'
              >
                {[
                  { label: "EARLY ACCESS SEASON", value: "Limited participants, access closes automatically" },

                ].map((stat, i) => (
                  <div key={i} className='hero-stat-item'>
                    <div className='hero-stat-value'>{stat.label}</div>
                    <div className='hero-stat-label'>{stat.value}</div>
                  </div>
                ))}
              </motion.div>

              {/* Background Glow behind image */}
              <div className='hero-glow'></div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 440px;
          margin-top: -140px;
          position: relative;
          z-index: 5;
        }

        .hero-stat-item {
          background: rgba(18, 18, 22, 0.6);
          border: 1px solid var(--panel-border);
          padding: 14px 18px;
          border-radius: 14px;
          text-align: center;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }

        .hero-stat-value {
          font-size: clamp(1rem, 1.8vw, 1.5rem);
          font-weight: 900;
          color: #fff;
          margin-bottom: 2px;
          background: linear-gradient(180deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-stat-label {
          font-size: 0.65rem;
          color: var(--text-dim);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .hero-section {
          position: relative;
          overflow: visible;
          padding-bottom: 40px;
        }

        .hero-container {
          padding-top: 20px;
          padding-bottom: 0;
          min-height: 70vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          display: flex;
          align-items: center;
          gap: 48px;
          width: 100%;
        }

        .hero-text {
          flex: 1;
          max-width: 100%;
          margin-top: -100px;
        }

        .hero-badge {
          color: var(--primary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.8rem;
          display: block;
          margin-bottom: 8px;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 3.5rem);
        }

        .hero-description {
          color: var(--text-dim);
          font-size: clamp(1rem, 2vw, 1.25rem);
          margin-top: 12px;
          margin-bottom: 16px;
          max-width: 540px;
          line-height: 1.4;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        .hero-cta a {
          text-decoration: none;
        }

        .hero-btn {
          padding: 16px 32px;
        }

        .hero-traders {
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .traders-avatars {
          display: flex;
          margin-left: 10px;
        }

        .trader-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1a1b1e;
          border: 2px solid var(--bg-color);
          margin-left: -10px;
          display: grid;
          place-items: center;
        }

        .hero-bullets {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 14px;
        }

        .hero-bullet-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hero-bullet-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0;
        }

        .bullet-checkmark {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .bullet-text {
          color: var(--text-dim);
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1.5;
        }

        .hero-bullet-item:hover .bullet-checkmark {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .hero-visual {
          flex: 1.2;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -80px;
        }

        .hero-visual-inner {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-image-container {
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-video-stage {
          position: relative;
          width: 100%;
          max-width: 600px;
          aspect-ratio: 1 / 1;
        }

        .hero-image {
          width: 100%;
          max-width: 600px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 0 100px rgba(0, 102, 255, 0.15)) saturate(0.8) brightness(1.1);
          /* Blend with background */
          mix-blend-mode: screen;
          /* Deeper fade edges */
          -webkit-mask-image: radial-gradient(circle at center, black 15%, transparent 90%);
          mask-image: radial-gradient(circle at center, black 15%, transparent 90%);
          opacity: 0.65;
          display: block;
        }

        .hero-video-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          max-width: none;
        }

        .floating-element {
          position: absolute;
          z-index: 2;
        }

        .floating-top {
          top: -5%;
          left: -5%;
        }

        .floating-bottom {
          bottom: 5%;
          right: 5%;
        }

        .badge-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: grid;
          place-items: center;
        }

        .badge-icon.gold {
          background: linear-gradient(135deg, #ffcc00, #ff9900);
          box-shadow: 0 8px 16px rgba(255, 204, 0, 0.3);
        }

        .badge-icon.surface {
          background: var(--surface);
          border: 1px solid var(--panel-border);
        }

        .badge-title {
          font-weight: 900;
          color: #fff;
        }

        .badge-subtitle {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-dim);
        }

        .badge-subtitle.success {
          color: var(--success);
        }

        .hero-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 60%);
          z-index: 0;
          opacity: 0.4;
        }

        @media (max-width: 1024px) {
          .hero-container {
            min-height: auto;
            padding-top: 40px;
            padding-bottom: 40px;
          }

          .hero-content {
            flex-direction: column;
            gap: 40px;
          }

          .hero-text {
            text-align: center;
            order: 0; /* Text first on mobile */
            margin-top: 0;
          }

          .hero-description {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-cta {
            justify-content: center;
          }

          .hero-bullets {
            align-items: center;
            margin-top: 24px;
            gap: 10px;
          }

          .hero-bullet-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .hero-visual {
            order: 1; /* Visual second on mobile */
            width: 100%;
            max-width: 440px;
            margin: 0 auto;
            margin-top: -80px;
          }

          .hero-image {
            width: 100%;
            margin-right: 0;
          }

          .floating-top {
            top: 5%;
            left: 0;
            transform: scale(0.85);
          }

          .floating-bottom {
            bottom: 15%;
            right: 0;
            transform: scale(0.85);
          }

          .hero-stats {
            margin-top: -25px;
            max-width: 400px;
            padding: 0 16px;
            gap: 10px;
          }

          .hero-stat-item {
            padding: 12px 16px;
            border-radius: 12px;
          }

          .hero-stat-value {
            font-size: clamp(0.95rem, 1.6vw, 1.3rem);
          }

          .hero-stat-label {
            font-size: 0.6rem;
          }
        }

        @media (max-width: 768px) {
          .hero-container {
            padding-top: 30px;
            padding-bottom: 30px;
            padding-left: 20px;
            padding-right: 20px;
          }

          .hero-content {
            gap: 24px;
          }

          .hero-text {
            padding: 0;
          }

          .hero-visual {
            max-width: 320px;
            margin-top: -60px;
          }

          .hero-badge {
            font-size: 0.65rem;
            letter-spacing: 0.15em;
            margin-bottom: 12px;
          }

          .hero-title {
            font-size: 2.2rem;
          }

          .hero-description {
            font-size: 0.95rem;
            margin-top: 16px;
            margin-bottom: 24px;
          }

          .hero-btn {
            padding: 14px 24px;
            font-size: 0.9rem;
          }

        .hero-traders span {
          font-size: 0.8rem;
        }

        .hero-bullets {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }

        .hero-bullet-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }

        .hero-bullet-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 0;
        }

        .bullet-checkmark {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .bullet-text {
          color: var(--text-dim);
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1.4;
        }

        .hero-stat-item {
          padding: 10px 14px;
          border-radius: 10px;
        }

        .hero-stats {
          margin-top: -20px;
          max-width: 360px;
          padding: 0 12px;
          gap: 8px;
        }

        .hero-stat-value {
          font-size: clamp(0.9rem, 1.4vw, 1.2rem);
        }

        .hero-stat-label {
          font-size: 0.55rem;
        }

          .floating-badge {
            padding: 10px 14px;
            gap: 10px;
          }

          .badge-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }

          .badge-icon svg {
            width: 18px;
            height: 18px;
          }

          .badge-title {
            font-size: 0.75rem;
          }

          .badge-subtitle {
            font-size: 0.65rem;
          }

          .floating-top {
            left: -5px;
            top: 0;
            transform: scale(0.8);
          }

          .floating-bottom {
            right: -5px;
            bottom: 10%;
            transform: scale(0.8);
          }
        }

        @media (max-width: 480px) {
          .hero-container {
            padding-top: 16px;
            padding-bottom: 24px;
            padding-left: 16px;
            padding-right: 16px;
          }

          .hero-content {
            gap: 16px;
          }

          .hero-visual {
            max-width: 280px;
            margin-top: -40px;
          }

          .hero-title {
            font-size: 2rem;
            line-height: 1.1;
          }

          .hero-badge {
            font-size: 0.6rem;
            letter-spacing: 0.12em;
          }

          .hero-description {
            font-size: 0.85rem;
            margin-top: 12px;
            margin-bottom: 20px;
            padding: 0;
          }

          .hero-cta {
            flex-direction: column;
            width: 100%;
            gap: 14px;
            padding: 0;
          }

          .hero-btn {
            width: 100%;
            padding: 14px 20px;
            font-size: 0.85rem;
          }

          .hero-traders {
            justify-content: center;
          }

          .hero-traders span {
            font-size: 0.75rem;
          }

          .hero-bullets {
            margin-top: 16px;
            gap: 6px;
          }

          .hero-bullet-row {
            gap: 4px;
          }

          .hero-bullet-item {
            gap: 8px;
          }

          .bullet-checkmark {
            width: 20px;
            height: 20px;
            border-radius: 4px;
          }

          .bullet-text {
            font-size: 0.85rem;
          }

          .hero-stats {
            margin-top: -15px;
            max-width: 300px;
            padding: 0 10px;
            gap: 6px;
          }

          .hero-stat-item {
            padding: 8px 12px;
            border-radius: 8px;
          }

          .hero-stat-value {
            font-size: 0.85rem;
          }

          .hero-stat-label {
            font-size: 0.5rem;
          }

          .floating-element {
            transform: scale(0.65);
            transform-origin: center;
          }

          .floating-top {
            left: -15px;
            top: 5%;
          }

          .floating-bottom {
            right: -15px;
            bottom: 15%;
          }

          .trader-avatar {
            width: 26px;
            height: 26px;
            margin-left: -8px;
          }

          .traders-avatars {
            margin-left: 8px;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
