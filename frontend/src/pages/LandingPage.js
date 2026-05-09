import { ArrowRight, ShieldCheck, Star, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { allianceAirlines } from '../data/mockData';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-scrim" />
        <div className="hero-content">
          <div className="hero-kicker">AeroTeams loyalty ecosystem</div>
          <h1>AeroMiles unifies members, staff workflows, and rewards across five airlines.</h1>
          <p>
            A premium alliance portal for mileage accrual, claims, transfers, redemptions, and operations oversight.
          </p>
          <div className="hero-actions">
            <Link className="button button-accent icon-label" to="/login?role=member">
              Member Login
              <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary-light icon-label" to="/login?role=staff">
              Staff Login
              <ShieldCheck size={16} />
            </Link>
          </div>
          <div className="hero-metrics">
            <div>
              <strong>1.42M</strong>
              <span>miles issued this month</span>
            </div>
            <div>
              <strong>84%</strong>
              <span>claims approved within SLA</span>
            </div>
            <div>
              <strong>5</strong>
              <span>alliance carriers in one program</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div className="section-heading">
          <div>
            <div className="eyebrow">AeroTeams alliance</div>
            <h2>Operating carriers</h2>
          </div>
          <p>Consistent loyalty experience across Nusantara Air, LionSky, Bumi Airlines, Ozi Skies, and Sakura Airways.</p>
        </div>

        <div className="airline-strip">
          {allianceAirlines.map((airline) => (
            <article key={airline.code} className="airline-pill">
              <span className="airline-code">{airline.code}</span>
              <div>
                <strong>{airline.name}</strong>
                <span>{airline.region}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band landing-band-muted">
        <div className="feature-grid">
          <article className="feature-card">
            <Star size={18} />
            <h3>Member-first journeys</h3>
            <p>Tier tracking, reward redemption, missing miles claims, and identity readiness in one place.</p>
          </article>
          <article className="feature-card">
            <Ticket size={18} />
            <h3>Operational controls</h3>
            <p>Claim review, member CRUD, staff management, and transaction visibility for staff teams.</p>
          </article>
          <article className="feature-card">
            <ShieldCheck size={18} />
            <h3>Mocked for testability</h3>
            <p>Every form, modal, and CRUD state is deterministic for Selenium and local validation flows.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
