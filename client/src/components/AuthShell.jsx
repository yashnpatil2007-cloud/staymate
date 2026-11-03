import { CheckCircle2, Home, Users, UtensilsCrossed } from 'lucide-react';
import Logo from './Logo';

const POINTS = [
  {
    icon: Home,
    title: 'Accommodation that fits real budgets',
    text: 'Hostels, PGs, rooms, flats and apartments with transparent rent and deposits.'
  },
  {
    icon: Users,
    title: 'Roommates, matched on substance',
    text: 'Compatibility built from budget, locality, schedule and lifestyle preferences.'
  },
  {
    icon: UtensilsCrossed,
    title: 'Food nearby, without the guesswork',
    text: 'Compare mess and tiffin services by menu, meals and monthly price.'
  }
];

export default function AuthShell({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-aside-content">
          <Logo light />
          <h2 className="display">A new city feels better when the basics are sorted.</h2>
          <p className="lead">
            StayMate helps students and working professionals settle in with the right stay, the
            right people and dependable daily meals.
          </p>
          <div className="auth-points">
            {POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div className="auth-point" key={point.title}>
                  <span className="auth-point-icon">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p>{point.title}</p>
                    <span>{point.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="auth-footnote">
          <CheckCircle2 size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
          Listings are reviewed before they go live. Reviews require a verified interaction.
        </div>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  );
}
