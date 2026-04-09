export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:      #1b5e30;
          --green-dark: #0d3a1b;
          --green-mid:  #2d7a45;
          --green-lt:   #4a9e62;
          --crimson:    #8b1a1a;
          --crimson-lt: #b02020;
          --gold:       #c9941a;
          --gold-lt:    #e8b84b;
          --gold-pale:  #f5e6c0;
          --cream:      #faf6ee;
          --cream2:     #f0e9d8;
          --white:      #ffffff;
          --text:       #1a1a1a;
          --text-mid:   #3d3d3d;
          --text-soft:  #6b6b6b;
          --border:     rgba(27,94,48,0.15);
        }

        html { scroll-behavior: smooth; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--text);
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* ─── NAVBAR ─── */
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(13,58,27,0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(201,148,26,0.2);
          padding: 0 48px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .nav-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid var(--gold);
          object-fit: cover;
        }

        .nav-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--white);
          letter-spacing: 0.5px;
          line-height: 1.1;
        }

        .nav-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 400;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }

        .nav-links a {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.3px;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--gold-lt); }

        .nav-cta {
          background: var(--gold);
          color: var(--green-dark) !important;
          font-weight: 600 !important;
          padding: 9px 22px;
          border-radius: 6px;
          transition: background 0.2s !important;
        }
        .nav-cta:hover { background: var(--gold-lt) !important; color: var(--green-dark) !important; }

        /* ─── HERO ─── */
        .hero {
          min-height: 100vh;
          background: var(--green-dark);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding-top: 68px;
        }

        /* Decorative circles */
        .hero::before {
          content: '';
          position: absolute;
          width: 900px; height: 900px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.08);
          top: -200px; right: -200px;
          pointer-events: none;
        }
        .hero::after {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.06);
          bottom: -150px; left: -100px;
          pointer-events: none;
        }

        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 48px;
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 80px;
          align-items: center;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .hero-eyebrow-line {
          width: 32px;
          height: 1px;
          background: var(--gold);
        }

        .hero-eyebrow-text {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--gold-lt);
        }

        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 62px;
          font-weight: 700;
          color: var(--white);
          line-height: 1.08;
          margin-bottom: 28px;
          letter-spacing: -0.5px;
        }

        .hero-h1 em {
          font-style: italic;
          color: var(--gold-lt);
        }

        .hero-desc {
          font-size: 17px;
          color: rgba(255,255,255,0.6);
          line-height: 1.75;
          max-width: 520px;
          margin-bottom: 44px;
          font-weight: 300;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--crimson);
          color: var(--white);
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.3px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: inline-block;
        }
        .btn-primary:hover { background: var(--crimson-lt); transform: translateY(-1px); }

        .btn-outline {
          background: transparent;
          color: var(--white);
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          border: 1px solid rgba(255,255,255,0.25);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          display: inline-block;
        }
        .btn-outline:hover { border-color: var(--gold); color: var(--gold-lt); }

        /* Hero card */
        .hero-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(201,148,26,0.2);
          border-radius: 16px;
          padding: 36px;
          backdrop-filter: blur(8px);
        }

        .hero-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
        }

        .hero-logo-img {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: 3px solid var(--gold);
          box-shadow: 0 0 60px rgba(201,148,26,0.2), 0 0 0 8px rgba(201,148,26,0.06);
          object-fit: cover;
        }

        .hero-school-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--white);
          line-height: 1.4;
        }

        .hero-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .hero-founded {
          font-size: 12px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 8px;
          width: 100%;
        }

        .hero-stat {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,148,26,0.15);
          border-radius: 8px;
          padding: 14px 12px;
          text-align: center;
        }

        .hero-stat-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--gold-lt);
          line-height: 1;
          margin-bottom: 4px;
        }

        .hero-stat-l {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.5px;
        }

        /* ─── GOLD STRIP ─── */
        .gold-strip {
          background: var(--gold);
          padding: 18px 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
        }

        .strip-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: var(--green-dark);
          letter-spacing: 0.3px;
        }

        .strip-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--green-dark);
          opacity: 0.4;
        }

        /* ─── ABOUT ─── */
        .about {
          padding: 100px 48px;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .section-tag-line {
          width: 24px; height: 2px;
          background: var(--crimson);
        }

        .section-tag-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--crimson);
        }

        .section-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px;
          font-weight: 700;
          color: var(--green-dark);
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.3px;
        }

        .section-h2 em {
          font-style: italic;
          color: var(--crimson);
        }

        .section-p {
          font-size: 16px;
          color: var(--text-soft);
          line-height: 1.8;
          margin-bottom: 16px;
          font-weight: 300;
        }

        .values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 32px;
        }

        .value-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          border-left: 3px solid var(--green);
        }

        .value-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--green-dark);
          margin-bottom: 6px;
        }

        .value-desc {
          font-size: 13px;
          color: var(--text-soft);
          line-height: 1.6;
          font-weight: 300;
        }

        /* About right side - decorative */
        .about-visual {
          position: relative;
        }

        .about-main-card {
          background: var(--green-dark);
          border-radius: 16px;
          padding: 40px;
          color: var(--white);
          position: relative;
          overflow: hidden;
        }

        .about-main-card::before {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.1);
          top: -80px; right: -80px;
        }

        .quote-mark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 96px;
          color: rgba(201,148,26,0.2);
          line-height: 0.8;
          margin-bottom: 16px;
          display: block;
        }

        .quote-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-style: italic;
          line-height: 1.5;
          color: rgba(255,255,255,0.9);
          margin-bottom: 20px;
        }

        .quote-attr {
          font-size: 12px;
          color: var(--gold-lt);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .about-sub-card {
          background: var(--gold-pale);
          border: 1px solid rgba(201,148,26,0.3);
          border-radius: 12px;
          padding: 20px 24px;
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .about-sub-icon {
          width: 48px; height: 48px;
          background: var(--gold);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 22px;
        }

        .about-sub-title {
          font-weight: 600;
          color: var(--green-dark);
          font-size: 15px;
          margin-bottom: 2px;
        }

        .about-sub-desc {
          font-size: 13px;
          color: var(--text-soft);
          font-weight: 300;
        }

        /* ─── PROGRAMS ─── */
        .programs-section {
          background: var(--green-dark);
          padding: 100px 48px;
        }

        .programs-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .programs-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .programs-header .section-tag-line { background: var(--gold); }
        .programs-header .section-tag-text { color: var(--gold-lt); }

        .programs-header .section-h2 {
          color: var(--white);
        }

        .programs-header .section-h2 em {
          color: var(--gold-lt);
        }

        .programs-header .section-p {
          color: rgba(255,255,255,0.5);
          max-width: 540px;
          margin: 0 auto;
        }

        .programs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .program-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(201,148,26,0.15);
          border-radius: 12px;
          padding: 32px;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          cursor: default;
        }
        .program-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(201,148,26,0.35);
          transform: translateY(-3px);
        }

        .program-icon {
          width: 52px; height: 52px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .program-icon-green { background: rgba(45,122,69,0.3); }
        .program-icon-crimson { background: rgba(139,26,26,0.3); }
        .program-icon-gold { background: rgba(201,148,26,0.2); }

        .program-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 10px;
        }

        .program-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          font-weight: 300;
        }

        .program-tag {
          display: inline-block;
          margin-top: 16px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--gold-lt);
          padding: 4px 10px;
          background: rgba(201,148,26,0.1);
          border: 1px solid rgba(201,148,26,0.2);
          border-radius: 4px;
        }

        /* ─── LINURI SECTION ─── */
        .linuri-section {
          padding: 100px 48px;
          background: var(--cream2);
        }

        .linuri-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .linuri-badge {
          display: inline-block;
          background: var(--crimson);
          color: var(--white);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .linuri-features {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .linuri-feature {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .lf-icon {
          width: 40px; height: 40px;
          background: var(--green);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .lf-title {
          font-weight: 600;
          color: var(--text);
          font-size: 15px;
          margin-bottom: 3px;
        }

        .lf-desc {
          font-size: 13px;
          color: var(--text-soft);
          line-height: 1.6;
          font-weight: 300;
        }

        .linuri-cta-group {
          display: flex;
          gap: 14px;
          margin-top: 36px;
          flex-wrap: wrap;
        }

        /* LINURI visual */
        .linuri-visual {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(27,94,48,0.1);
        }

        .linuri-visual-header {
          background: var(--green-dark);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dot-row {
          display: flex; gap: 6px;
        }

        .dot-w { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2); }

        .linuri-visual-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          margin-left: auto;
          margin-right: auto;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .linuri-visual-body {
          padding: 28px;
        }

        .lv-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }

        .lv-row:last-child { border-bottom: none; }

        .lv-label { color: var(--text-soft); font-weight: 300; }

        .lv-pill {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .pill-green { background: rgba(27,94,48,0.1); color: var(--green); }
        .pill-amber { background: rgba(201,148,26,0.12); color: #9a6f10; }
        .pill-red { background: rgba(139,26,26,0.1); color: var(--crimson); }

        .lv-bar-wrap {
          flex: 1;
          height: 6px;
          background: var(--cream2);
          border-radius: 3px;
          margin: 0 12px;
          overflow: hidden;
        }

        .lv-bar {
          height: 100%;
          border-radius: 3px;
          background: var(--green);
        }

        /* ─── CONTACT ─── */
        .contact-section {
          background: var(--white);
          padding: 100px 48px;
        }

        .contact-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 56px;
          text-align: left;
        }

        .contact-card {
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
        }

        .contact-card-icon {
          font-size: 28px;
          margin-bottom: 14px;
          display: block;
        }

        .contact-card-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 6px;
        }

        .contact-card-value {
          font-size: 15px;
          color: var(--text);
          font-weight: 400;
          line-height: 1.5;
        }

        /* ─── FOOTER ─── */
        footer {
          background: var(--green-dark);
          padding: 48px;
          border-top: 1px solid rgba(201,148,26,0.2);
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .footer-logo {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(201,148,26,0.4);
          object-fit: cover;
        }

        .footer-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--white);
        }

        .footer-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          line-height: 1.6;
        }

        .footer-copy {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          text-align: right;
        }

        .footer-linuri {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-linuri-badge {
          background: rgba(201,148,26,0.15);
          border: 1px solid rgba(201,148,26,0.3);
          color: var(--gold-lt);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          padding: 4px 12px;
          border-radius: 4px;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
          .hero-inner { grid-template-columns: 1fr; gap: 48px; }
          .hero-card { max-width: 400px; }
          .hero-h1 { font-size: 48px; }
          .about { grid-template-columns: 1fr; gap: 48px; }
          .programs-grid { grid-template-columns: 1fr 1fr; }
          .linuri-inner { grid-template-columns: 1fr; gap: 48px; }
          .contact-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 24px; }
          .nav-links { display: none; }
          .hero-inner { padding: 48px 24px; }
          .hero-h1 { font-size: 38px; }
          .about { padding: 72px 24px; }
          .programs-section { padding: 72px 24px; }
          .programs-grid { grid-template-columns: 1fr; }
          .linuri-section { padding: 72px 24px; }
          .contact-section { padding: 72px 24px; }
          footer { padding: 40px 24px; }
          .gold-strip { padding: 14px 24px; gap: 24px; }
          .values-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(13,58,27,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(201,148,26,0.2)', padding: '0 48px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="UMCLS" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #c9941a', objectFit: 'cover' }} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px', lineHeight: 1.1 }}>UMCLS</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>Caloocan City · Est. 2006</div>
          </div>
        </a>
        <ul style={{ display: 'flex', alignItems: 'center', gap: '32px', listStyle: 'none' }}>
          <li><a href="#about" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>About</a></li>
          <li><a href="#programs" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Programs</a></li>
          <li><a href="#linuri" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>LINURI</a></li>
          <li><a href="#contact" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Contact</a></li>
          <li><a href="/login" style={{ background: '#c9941a', color: '#0d3a1b', fontWeight: 600, padding: '9px 22px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', transition: 'background 0.2s' }}>Sign In</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', background: '#0d3a1b', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: '68px' }}>
        <div style={{ position: 'absolute', width: '900px', height: '900px', borderRadius: '50%', border: '1px solid rgba(201,148,26,0.07)', top: '-200px', right: '-200px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(201,148,26,0.05)', bottom: '-100px', left: '-80px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '80px', alignItems: 'center', width: '100%', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '1px', background: '#c9941a' }} />
              <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#e8b84b' }}>United Methodist Cooperative Learning System, Inc.</span>
            </div>

            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '62px', fontWeight: 700, color: '#fff', lineHeight: 1.08, marginBottom: '28px', letterSpacing: '-0.5px' }}>
              Shaping Minds,<br />
              <em style={{ fontStyle: 'italic', color: '#e8b84b' }}>Nurturing Faith,</em><br />
              Building Futures.
            </h1>

            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: '520px', marginBottom: '44px', fontWeight: 300 }}>
              A Christ-centered learning community in Caloocan City dedicated to holistic education — developing academically excellent, morally upright, and socially responsible learners since 2006.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="#about" style={{ background: '#8b1a1a', color: '#fff', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'inline-block' }}>
                Discover Our School
              </a>
              <a href="#linuri" style={{ background: 'transparent', color: '#fff', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, fontSize: '15px', border: '1px solid rgba(255,255,255,0.25)', display: 'inline-block' }}>
                Explore LINURI
              </a>
            </div>
          </div>

          {/* Hero card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,148,26,0.2)', borderRadius: '16px', padding: '36px', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '18px' }}>
              <img src="/logo.png" alt="UMCLS Logo" style={{ width: '150px', height: '150px', borderRadius: '50%', border: '3px solid #c9941a', boxShadow: '0 0 60px rgba(201,148,26,0.2), 0 0 0 8px rgba(201,148,26,0.06)', objectFit: 'cover' }} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>United Methodist Cooperative<br />Learning System, Inc.</div>
              <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, transparent, #c9941a, transparent)' }} />
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Caloocan City · Founded 2006</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '8px' }}>
                {[
                  { n: 'K–12', l: 'Programs' },
                  { n: '2006', l: 'Est. Year' },
                  { n: '3', l: 'Subjects' },
                  { n: 'G6', l: 'LINURI Focus' },
                ].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,148,26,0.12)', borderRadius: '8px', padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: '#e8b84b', lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GOLD STRIP */}
      <div style={{ background: '#c9941a', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
        {['Christ-Centered Education', 'Caloocan City, NCR', 'K–12 Curriculum', 'DepEd Recognized', 'Est. 2006'].map((item, i, arr) => (
          <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#0d3a1b', letterSpacing: '0.3px' }}>
            {item}
            {i < arr.length - 1 && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0d3a1b', opacity: 0.4, display: 'inline-block' }} />}
          </span>
        ))}
      </div>

      {/* ABOUT */}
      <section id="about" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '2px', background: '#8b1a1a' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#8b1a1a' }}>About the School</span>
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '44px', fontWeight: 700, color: '#0d3a1b', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.3px' }}>
              A Community Built on <em style={{ fontStyle: 'italic', color: '#8b1a1a' }}>Faith & Learning</em>
            </h2>

            <p style={{ fontSize: '16px', color: '#6b6b6b', lineHeight: 1.8, marginBottom: '16px', fontWeight: 300 }}>
              United Methodist Cooperative Learning System, Inc. (UMCLS) is a private, Christ-centered school serving the families of Caloocan City. Founded in 2006, we provide quality K–12 education grounded in United Methodist values — nurturing the whole child in body, mind, and spirit.
            </p>
            <p style={{ fontSize: '16px', color: '#6b6b6b', lineHeight: 1.8, marginBottom: '0', fontWeight: 300 }}>
              Our dedicated teachers and staff create an environment where every learner is seen, supported, and challenged to grow — academically, morally, and socially.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '32px' }}>
              {[
                { title: 'Excellence', desc: 'High academic standards across all grade levels and subjects' },
                { title: 'Faith', desc: 'Christ-centered values woven into daily school life' },
                { title: 'Community', desc: 'A family atmosphere where every child belongs' },
                { title: 'Service', desc: 'Growing students to contribute meaningfully to society' },
              ].map(v => (
                <div key={v.title} style={{ background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '18px', borderLeft: '3px solid #1b5e30' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 700, color: '#0d3a1b', marginBottom: '5px' }}>{v.title}</div>
                  <div style={{ fontSize: '13px', color: '#6b6b6b', lineHeight: 1.6, fontWeight: 300 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ background: '#0d3a1b', borderRadius: '16px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', border: '1px solid rgba(201,148,26,0.1)', top: '-70px', right: '-70px' }} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '80px', color: 'rgba(201,148,26,0.15)', lineHeight: 0.8, marginBottom: '16px' }}>&ldquo;</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontStyle: 'italic', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
                We connect knowledge and vital piety — educating the whole person in body, mind, and spirit.
              </p>
              <div style={{ fontSize: '12px', color: '#e8b84b', letterSpacing: '1px', textTransform: 'uppercase' }}>John Wesley · Founder of Methodism</div>
            </div>

            <div style={{ background: '#f5e6c0', border: '1px solid rgba(201,148,26,0.3)', borderRadius: '12px', padding: '20px 24px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#c9941a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🤝</div>
              <div>
                <div style={{ fontWeight: 600, color: '#0d3a1b', fontSize: '15px', marginBottom: '2px' }}>Cooperative Learning</div>
                <div style={{ fontSize: '13px', color: '#6b6b6b', fontWeight: 300 }}>Collaborative, student-centered approach at every level</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" style={{ background: '#0d3a1b', padding: '100px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '2px', background: '#c9941a' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#e8b84b' }}>Academic Offerings</span>
              <div style={{ width: '24px', height: '2px', background: '#c9941a' }} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '44px', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
              Programs <em style={{ fontStyle: 'italic', color: '#e8b84b' }}>& Subjects</em>
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto', fontWeight: 300, lineHeight: 1.7 }}>
              A complete K–12 curriculum aligned with DepEd standards, enriched with values formation and cooperative learning strategies.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { icon: '📚', bg: 'rgba(45,122,69,0.25)', title: 'English', desc: 'Developing literacy, communication, and critical reading skills through progressive language instruction from Kinder through Grade 12.', tag: 'Core Subject' },
              { icon: '🔢', bg: 'rgba(139,26,26,0.25)', title: 'Mathematics', desc: 'Building numerical fluency and logical reasoning with a spiral curriculum that deepens understanding at every grade level.', tag: 'Core Subject' },
              { icon: '🔬', bg: 'rgba(201,148,26,0.18)', title: 'Science', desc: 'Fostering curiosity and scientific thinking through hands-on inquiry, experiments, and real-world problem solving.', tag: 'Core Subject' },
            ].map(p => (
              <div key={p.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,148,26,0.15)', borderRadius: '12px', padding: '32px', transition: 'transform 0.2s' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px', background: p.bg }}>{p.icon}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>{p.title}</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontWeight: 300 }}>{p.desc}</p>
                <div style={{ display: 'inline-block', marginTop: '18px', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#e8b84b', padding: '4px 10px', background: 'rgba(201,148,26,0.1)', border: '1px solid rgba(201,148,26,0.2)', borderRadius: '4px' }}>{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LINURI */}
      <section id="linuri" style={{ padding: '100px 48px', background: '#f0e9d8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: '#8b1a1a', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: '20px', marginBottom: '20px' }}>
              New for 2026
            </div>

            <div style={{  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',  }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '44px', fontWeight: 700, color: '#0d3a1b', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
                Introducing <em style={{ fontStyle: 'italic', color: '#8b1a1a' }}>LINURI</em>
              </h2>
            </div>

            <p style={{ fontSize: '16px', color: '#6b6b6b', lineHeight: 1.8, marginBottom: '16px', fontWeight: 300 }}>
              The <strong style={{ color: '#1b5e30', fontWeight: 600 }}>Literacy and Numeracy Readiness Indicator</strong> — our AI-powered adaptive learning system built specifically for Grade 6 at UMCLS. LINURI helps teachers see exactly where each student stands and adjusts automatically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '28px' }}>
              {[
                { icon: '🧠', title: 'AI Question Generation', desc: 'Google Gemini generates quiz questions at Basic, Standard, and Advanced levels from teacher lesson content.' },
                { icon: '📊', title: 'Mastery Tracking', desc: 'After each quiz, a decision tree classifier identifies each student as needs help, developing, or mastered.' },
                { icon: '🔄', title: 'Adaptive Difficulty', desc: 'The system automatically adjusts the next quiz difficulty — up, same, or down — per student, per skill.' },
                { icon: '🚩', title: 'Flagged Student Alerts', desc: 'Teachers are notified when a student regresses twice or more on the same skill.' },
              ].map(f => (
                <div key={f.title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', background: '#1b5e30', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '15px', marginBottom: '3px' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', color: '#6b6b6b', lineHeight: 1.6, fontWeight: 300 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '14px', marginTop: '36px', flexWrap: 'wrap' }}>
              <a href="/login" style={{ background: '#1b5e30', color: '#fff', padding: '13px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>Sign In to LINURI</a>
              <a href="/auth/register" style={{ background: 'transparent', color: '#1b5e30', padding: '13px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, fontSize: '15px', border: '1.5px solid #1b5e30' }}>Register</a>
            </div>
          </div>

          {/* Mock dashboard card */}
          <div style={{ background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(27,94,48,0.1)' }}>
            <div style={{ background: '#0d3a1b', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)'].map((c, i) => (
                  <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>LINURI Dashboard</div>
              <div />
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#1b5e30', marginBottom: '14px' }}>Grade 6 · Skill Mastery</div>

              {[
                { name: 'English – Reading Comprehension', pct: 82, level: 'Mastered', pill: 'pill-green' },
                { name: 'Math – Fractions & Decimals', pct: 61, level: 'Developing', pill: 'pill-amber' },
                { name: 'Science – Matter & Energy', pct: 44, level: 'Needs Help', pill: 'pill-red' },
                { name: 'English – Grammar & Usage', pct: 75, level: 'Mastered', pill: 'pill-green' },
                { name: 'Math – Problem Solving', pct: 58, level: 'Developing', pill: 'pill-amber' },
              ].map(row => (
                <div key={row.name} style={{ padding: '12px 0', borderBottom: '1px solid rgba(27,94,48,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#3d3d3d', fontWeight: 400 }}>{row.name}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                      background: row.level === 'Mastered' ? 'rgba(27,94,48,0.1)' : row.level === 'Developing' ? 'rgba(201,148,26,0.12)' : 'rgba(139,26,26,0.1)',
                      color: row.level === 'Mastered' ? '#1b5e30' : row.level === 'Developing' ? '#9a6f10' : '#8b1a1a',
                    }}>{row.level}</span>
                  </div>
                  <div style={{ height: '5px', background: '#f0e9d8', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px', width: `${row.pct}%`,
                      background: row.level === 'Mastered' ? '#1b5e30' : row.level === 'Developing' ? '#c9941a' : '#8b1a1a',
                    }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(139,26,26,0.07)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>🚩</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b1a1a' }}>2 students flagged</div>
                  <div style={{ fontSize: '12px', color: '#6b6b6b', fontWeight: 300 }}>Regressed on Math · Needs teacher attention</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: '#fff', padding: '100px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '24px', height: '2px', background: '#8b1a1a' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#8b1a1a' }}>Get in Touch</span>
            <div style={{ width: '24px', height: '2px', background: '#8b1a1a' }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '44px', fontWeight: 700, color: '#0d3a1b', lineHeight: 1.1, marginBottom: '16px' }}>
            Visit or <em style={{ fontStyle: 'italic', color: '#8b1a1a' }}>Contact Us</em>
          </h2>
          <p style={{ fontSize: '16px', color: '#6b6b6b', lineHeight: 1.7, fontWeight: 300 }}>
            We welcome parents, guardians, and prospective students to come and see our school community firsthand.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '52px', textAlign: 'left' }}>
            {[
              { icon: '📍', label: 'Address', value: 'Caloocan City\nNational Capital Region\nPhilippines' },
              { icon: '📘', label: 'Facebook', value: 'United Methodist\nCooperative Learning\nSystem, Inc.' },
              { icon: '🏫', label: 'Level', value: 'K–12 Basic Education\nDepEd Recognized\nEstablished 2006' },
            ].map(c => (
              <div key={c.label} style={{ background: '#faf6ee', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '12px', padding: '28px' }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{c.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#1b5e30', marginBottom: '6px' }}>{c.label}</div>
                <div style={{ fontSize: '15px', color: '#1a1a1a', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{c.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0d3a1b', padding: '48px', borderTop: '1px solid rgba(201,148,26,0.2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/logo.png" alt="UMCLS" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(201,148,26,0.4)', objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 700, color: '#fff' }}>United Methodist Cooperative Learning System, Inc.</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>Caloocan City · Est. 2006 · Christ-Centered Education</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <span style={{ background: 'rgba(201,148,26,0.15)', border: '1px solid rgba(201,148,26,0.3)', color: '#e8b84b', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', padding: '4px 12px', borderRadius: '4px' }}>LINURI 2026</span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
              © 2026 UMCLS · All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}