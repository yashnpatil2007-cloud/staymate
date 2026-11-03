import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  HeartHandshake,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
  X
} from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';

export default function AboutPage() {
  usePageMeta(
    'About StayMate',
    'StayMate is a discovery platform for accommodation, compatible roommates and food services — built around transparency and verified interactions.'
  );
  const [stats, setStats] = useState({ properties: 0, foodProviders: 0, cities: 0 });

  useEffect(() => {
    api.get('/properties/home').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  return (
    <div className="page page-top">
      <div className="container">
        <div className="about-hero">
          <span className="eyebrow">About StayMate</span>
          <h1 className="display">
            Moving to a new city should feel like a beginning, <em>not a scavenger hunt.</em>
          </h1>
          <p>
            StayMate brings accommodation, compatible roommates and dependable food services into
            one clear, moderated platform. The goal is simple: fewer dead ends, fewer sketchy
            listings, and better decisions before you sign anything.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link to="/accommodations" className="btn btn-primary">
              <Search size={16} /> Find accommodation
            </Link>
            <Link to="/list-your-property" className="btn btn-outline">
              List your property <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="about-stats">
          <div>
            <strong>{stats.properties || '—'}</strong>
            <span>approved stays</span>
          </div>
          <div>
            <strong>{stats.foodProviders || '—'}</strong>
            <span>approved food services</span>
          </div>
          <div>
            <strong>{stats.cities || '—'}</strong>
            <span>cities represented</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>discovery, no booking fee</span>
          </div>
        </div>

        <section className="section">
          <div className="about-split">
            <div>
              <span className="eyebrow">Why we built it</span>
              <h2 className="display">The week before you move is chaotic enough.</h2>
              <p className="lead-copy">
                Finding a room usually means scrolling through reposted photos, asking the same
                questions in five chat groups, and hoping the person on the other end is real.
                Finding a roommate is even less structured. Food is another app entirely.
              </p>
              <p className="lead-copy">
                StayMate is designed around the actual sequence of moving: decide your budget,
                shortlist a locality, compare real listings, contact the owner, and — if you are
                sharing — find someone whose daily habits fit yours.
              </p>
            </div>
            <div className="about-visual">
              <div className="about-visual-card main">
                <MapPin size={22} />
                <div>
                  <strong>One city, one search</strong>
                  <span>Stays, roommates and meals in the same place</span>
                </div>
              </div>
              <div className="about-visual-card">
                <BadgeCheck size={20} />
                <div>
                  <strong>Moderated before live</strong>
                  <span>New listings wait for admin approval</span>
                </div>
              </div>
              <div className="about-visual-card">
                <MessageSquare size={20} />
                <div>
                  <strong>Direct enquiries</strong>
                  <span>Reach the owner or provider, not a lead broker</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-alt" style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)' }}>
          <div className="container">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Principles</span>
                <h2 className="display">What we optimise for</h2>
                <p>Not time-on-site. Not lead volume. Better decisions before a deposit changes hands.</p>
              </div>
            </div>
            <div className="why-grid">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Transparency over polish',
                  text: 'Rent, deposit, occupancy, amenities and availability are shown plainly. Listings are labelled as demo content when they are demo content.'
                },
                {
                  icon: BadgeCheck,
                  title: 'Verification where it matters',
                  text: 'Listings require approval. Reviews require a confirmed enquiry interaction. Compatibility comes from saved preferences, not a random number.'
                },
                {
                  icon: Users,
                  title: 'People, not inventory',
                  text: 'Roommate profiles exist to help two people decide whether sharing a home makes sense — with privacy respected until both sides agree.'
                },
                {
                  icon: UtensilsCrossed,
                  title: 'Food is part of the move',
                  text: 'A room without a reliable meal plan is an incomplete decision. StayMate lets you compare messes, tiffins and monthly plans alongside stays.'
                },
                {
                  icon: HeartHandshake,
                  title: 'No fake urgency',
                  text: 'No countdown timers, no invented “12 people viewing now”, no purchased testimonials. If there is no review yet, the page says so.'
                },
                {
                  icon: Sparkles,
                  title: 'Free to discover',
                  text: 'Customers can browse and contact providers without a StayMate fee. Paid promotion and subscriptions are not enabled.'
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div className="why-card" key={item.title}>
                    <span className="why-icon"><Icon size={19} /></span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">How moderation works</span>
              <h2 className="display">Nothing appears publicly by default</h2>
              <p>A new listing starts as pending. An administrator reviews it before customers can find it.</p>
            </div>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Building2,
                title: 'Owner submits',
                text: 'Property details, photos, rent and house rules are submitted by an owner account. Food providers submit menu, meals and monthly pricing.'
              },
              {
                icon: ShieldCheck,
                title: 'Admin reviews',
                text: 'Every submission enters a moderation queue. The administrator can approve the listing, reject it with a reason, or hide content after a report.'
              },
              {
                icon: BadgeCheck,
                title: 'Listing goes live',
                text: 'Only approved listings appear in search, on city pages and in enquiries. Owners and providers see their approval status in their dashboard.'
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="step-card" key={step.title}>
                  <span className="step-number">0{index + 1}</span>
                  <span className="step-icon"><Icon size={20} /></span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Honest boundaries</span>
                <h2 className="display">What StayMate does — and does not — do</h2>
              </div>
            </div>
            <div className="two-col">
              <div className="do-card">
                <h3><Check size={18} /> What we do</h3>
                <ul className="check-list">
                  <li>Show moderated accommodation and food listings with real details</li>
                  <li>Calculate explainable roommate compatibility scores</li>
                  <li>Pass enquiries directly to owners and food providers</li>
                  <li>Support verified reviews after a confirmed interaction</li>
                  <li>Keep saved listings, requests and notifications in one dashboard</li>
                </ul>
              </div>
              <div className="dont-card">
                <h3><X size={18} /> What we do not do</h3>
                <ul className="dont-list">
                  <li>Take booking payments or hold security deposits</li>
                  <li>Guarantee that a listing is available until the owner confirms</li>
                  <li>Publish anonymous, invented or purchased reviews</li>
                  <li>Show contact details before a roommate request is accepted</li>
                  <li>Replace a physical visit, rent agreement or background check</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head center">
            <div className="section-head-copy">
              <span className="eyebrow">Who it is for</span>
              <h2 className="display">Three sides of the same move</h2>
            </div>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <span className="why-icon"><Users size={19} /></span>
              <h3>Students & professionals</h3>
              <p>Compare stays and food, find compatible roommates and keep every shortlist in one account.</p>
              <Link to="/accommodations" className="link-arrow">Start searching <ArrowRight size={14} /></Link>
            </div>
            <div className="audience-card">
              <span className="why-icon"><Building2 size={19} /></span>
              <h3>Property owners</h3>
              <p>List hostels, PGs, rooms, flats or apartments. Manage availability and enquiries without a listing fee.</p>
              <Link to="/list-your-property" className="link-arrow">List a property <ArrowRight size={14} /></Link>
            </div>
            <div className="audience-card">
              <span className="why-icon"><UtensilsCrossed size={19} /></span>
              <h3>Food providers</h3>
              <p>Publish your mess, tiffin or home kitchen with meal plans, menus and monthly pricing.</p>
              <Link to="/signup?role=food_provider" className="link-arrow">List food service <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        <div className="about-cta">
          <div>
            <span className="eyebrow">Ready when you are</span>
            <h2 className="display">Start with the city. We will help with the rest.</h2>
          </div>
          <div className="row">
            <Link to="/accommodations" className="btn btn-primary">Browse accommodation</Link>
            <Link to="/roommates" className="btn btn-light">Find roommates</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
