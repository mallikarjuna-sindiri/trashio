import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="about-page">
      <div className="container">
        <header className="about-hero card">
          <div className="about-hero-content">
            <span className="badge blue">TRASHIO</span>
            <h1 className="about-title">About Trashio</h1>
            <p className="about-subtitle">
              Trashio is a smart cleanliness reporting platform that connects citizens, admins, and cleaners to keep
              neighborhoods clean and safe.
            </p>
            <div className="about-hero-actions">
              <Link className="btn primary" to="/register">Get started</Link>
              <Link className="btn" to="/login">Login</Link>
            </div>
          </div>
        </header>

        <section className="about-grid">
          <div className="card about-card">
            <h3>Why it exists</h3>
            <p>
              Residents need a fast way to report garbage spots. Admins need a verified workflow. Cleaners need clear
              tasks and proof uploads. Trashio ties those roles together in one simple portal.
            </p>
          </div>
          <div className="card about-card">
            <h3>How it works</h3>
            <ul className="about-list">
              <li>Citizens create reports with photos and location details.</li>
              <li>Admins verify reports and assign tasks.</li>
              <li>Cleaners resolve tasks and upload proof of completion.</li>
            </ul>
          </div>
          <div className="card about-card">
            <h3>What you get</h3>
            <ul className="about-list">
              <li>Real-time status tracking and updates.</li>
              <li>Role-based dashboards for clarity.</li>
              <li>Rewards and community recognition for valid reports.</li>
            </ul>
          </div>
        </section>

        <section className="about-values card">
          <div>
            <h3>Our focus</h3>
            <p>
              We prioritize transparency, speed, and accountability. Every report is traceable, every update is visible,
              and every cleaner task is verified.
            </p>
          </div>
          <div className="about-values-grid">
            <div>
              <div className="about-value-title">Transparency</div>
              <div className="muted">Track every report from submission to cleanup.</div>
            </div>
            <div>
              <div className="about-value-title">Speed</div>
              <div className="muted">Rapid assignment flows and instant alerts.</div>
            </div>
            <div>
              <div className="about-value-title">Community</div>
              <div className="muted">Empower citizens to drive cleaner neighborhoods.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
