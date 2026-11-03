import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  Check,
  IndianRupee,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';

const FAQS = [
  {
    q: 'Does it cost anything to list?',
    a: 'No. Creating an owner account and submitting a property listing is free. StayMate does not currently sell promotions or subscriptions, and no payment is simulated.'
  },
  {
    q: 'Why is my listing pending?',
    a: 'Every new property and food listing is reviewed by an administrator before it appears publicly. You can track the status in your owner dashboard. Rejected listings show the reason so you can correct and resubmit.'
  },
  {
    q: 'Do I need professional photos?',
    a: 'No, but clear, honest photos get better enquiries. Upload up to eight images, show the actual room and common areas, and avoid old photos that no longer match the property.'
  },
  {
    q: 'How do I receive enquiries?',
    a: 'Customers send an enquiry from your public listing page. It appears in your owner dashboard and notification bell. You can mark it contacted or closed as you follow up.'
  },
  {
    q: 'Can I change rent or availability later?',
    a: 'Yes. Edit your listing at any time from the owner dashboard. Updates to rent, available beds and amenities are reflected on the public page.'
  }
];

export default function ListYourPropertyPage() {
  usePageMeta(
    'List Your Property',
    'List hostels, PGs, rooms, flats or apartments on StayMate. Free to list, moderated for quality, with direct customer enquiries.'
  );
  const { user } = useAuth();

  const cta = (() => {
    if (!user) return { to: '/signup?role=owner&next=/owner/listings/new', label: 'Create owner account' };
    if (user.role === 'owner') return { to: '/owner/listings/new', label: 'Add your property' };
    if (user.role === 'admin') return { to: '/admin/listings', label: 'Manage listings' };
    if (user.role === 'food_provider') return { to: '/provider/listings/new', label: 'List your food service' };
    return { to: '/dashboard', label: 'Go to my dashboard' };
  })();

  return (
    <div className="page page-top">
      <div className="container">
        <div className="list-hero">
          <div>
            <span className="eyebrow">For property owners</span>
            <h1 className="display">Your empty room has a customer. <em>Meet them.</em></h1>
            <p>
              List hostels, PGs, single rooms, shared rooms, flats or apartments on a platform built
              for people actively looking — with moderated quality and direct enquiries.
            </p>
            <div className="row" style={{ marginTop: 22 }}>
              <Link to={cta.to} className="btn btn-primary btn-lg">
                {cta.label} <ArrowRight size={16} />
              </Link>
              <Link to="/accommodations" className="btn btn-outline btn-lg">
                See example listings
              </Link>
            </div>
            {user && !['owner', 'admin'].includes(user.role) && (
              <p className="small muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
                You are signed in as a {user.role.replace('_', ' ')}. Customer accounts cannot publish
                listings; use an owner account to add property.
              </p>
            )}
            <div className="list-hero-points">
              <span><Check size={14} /> Free to list</span>
              <span><Check size={14} /> Moderated before live</span>
              <span><Check size={14} /> No booking commission</span>
            </div>
          </div>
          <div className="list-hero-card">
            <div className="listing-preview-card">
              <div className="listing-preview-head">
                <span className="badge badge-dark">PG</span>
                <span className="badge badge-teal">Live</span>
              </div>
              <div className="listing-preview-image">
                <Building2 size={34} />
              </div>
              <div className="listing-preview-body">
                <strong>Your property name</strong>
                <span>Your locality, your city</span>
                <div className="listing-preview-stats">
                  <div><IndianRupee size={14} /> Your rent</div>
                  <div><BedDouble size={14} /> Available beds</div>
                </div>
              </div>
            </div>
            <div className="listing-preview-float">
              <MessageSquare size={17} />
              <div>
                <strong>New enquiry</strong>
                <span>From an interested customer</span>
              </div>
            </div>
          </div>
        </div>

        <div className="list-benefits">
          {[
            {
              icon: Users,
              title: 'Reach active movers',
              text: 'Customers arrive with a city, budget and accommodation preference already in mind.'
            },
            {
              icon: ShieldCheck,
              title: 'Moderated marketplace',
              text: 'Admin approval before publishing keeps obvious spam and incomplete listings out.'
            },
            {
              icon: MessageSquare,
              title: 'Direct enquiries',
              text: 'No lead reselling or middlemen. Customer messages land in your dashboard.'
            },
            {
              icon: Sparkles,
              title: 'Simple listing flow',
              text: 'Add details and photos, set availability, submit once, then update whenever things change.'
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

        <section className="section">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">How listing works</span>
              <h2 className="display">From empty room to enquiry in four steps</h2>
            </div>
          </div>
          <div className="steps-grid four">
            {[
              {
                icon: Users,
                title: 'Create an owner account',
                text: 'Choose “Property owner” at signup. You can still browse stays and food services with the same account.'
              },
              {
                icon: Building2,
                title: 'Add the listing',
                text: 'Enter the type, locality, rent, deposit, occupancy, amenities, photos and house rules. Honest detail saves everyone time.'
              },
              {
                icon: ShieldCheck,
                title: 'Wait for approval',
                text: 'The listing appears as pending in your dashboard. An administrator reviews it before it becomes public.'
              },
              {
                icon: BadgeCheck,
                title: 'Respond to enquiries',
                text: 'Get notified when a customer is interested, mark the enquiry contacted and manage availability from your dashboard.'
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
            <div className="about-split">
              <div>
                <span className="eyebrow">For food providers too</span>
                <h2 className="display">Running a mess or tiffin kitchen?</h2>
                <p className="lead-copy">
                  List your food service with monthly pricing, meal availability, food preference and
                  a sample menu. Customers can compare your plan against other kitchens nearby.
                </p>
                <p className="lead-copy">
                  Food listings go through the same moderation queue, so approved services are
                  visible in search and can receive enquiries directly.
                </p>
                <Link to={user?.role === 'food_provider' ? '/provider/listings/new' : '/signup?role=food_provider'} className="btn btn-primary" style={{ marginTop: 8 }}>
                  List a food service <ArrowRight size={15} />
                </Link>
              </div>
              <div className="about-visual">
                <div className="about-visual-card main">
                  <Sparkles size={22} />
                  <div>
                    <strong>Monthly plans</strong>
                    <span>Breakfast, lunch and dinner combinations</span>
                  </div>
                </div>
                <div className="about-visual-card">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Moderated listings</strong>
                    <span>Reviewed before customers see them</span>
                  </div>
                </div>
                <div className="about-visual-card">
                  <MessageSquare size={20} />
                  <div>
                    <strong>Direct enquiries</strong>
                    <span>Customers ask about menus and trials</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head center">
            <div className="section-head-copy">
              <span className="eyebrow">Owner questions</span>
              <h2 className="display">Before you list</h2>
            </div>
          </div>
          <div className="faq-list">
            {FAQS.map((faq) => (
              <details className="faq-item" key={faq.q}>
                <summary>{faq.q}<span>+</span></summary>
                <p className="faq-answer">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="owner-cta">
          <div className="owner-cta-content">
            <span className="eyebrow">No listing fee</span>
            <h2 className="display">Put the room in front of people already searching.</h2>
            <p>Create an owner account, submit your property and manage every enquiry from one dashboard.</p>
            <div className="owner-cta-actions">
              <Link to={cta.to} className="btn btn-primary">
                {cta.label} <ArrowRight size={15} />
              </Link>
              <Link to="/about" className="btn btn-light">How StayMate works</Link>
            </div>
          </div>
          <div className="owner-cta-visual">
            <div className="img-fallback" style={{ height: '100%', minHeight: 220 }}>
              <Building2 size={44} />
              <span>List with clear details and honest photos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
