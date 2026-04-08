import React from 'react';
import LandingLayout from '../layout/LandingLayout';
import './LandingFAQ.css';

const sections = [
  {
    title: 'What we collect',
    text: `When you join the waitlist: your email address and an optional message.

When you log in with Steam: your Steam ID, username, and avatar URL. This data is public — provided by Steam. We never receive your password.

We also read your Steam achievement data to assign your rank automatically. This data is public on Steam.`,
  },
  {
    title: 'What we do not collect',
    text: `We do not collect payment information. There is no payment on this platform.

We do not collect private Steam data — inventory, purchases, friends list, or anything not publicly visible on your profile.

We do not use cookies for tracking. We do not run advertising networks.`,
  },
  {
    title: 'How we use your data',
    text: `Email: only to contact you when you are invited to the beta. We do not send newsletters, promotions, or any other emails.

Steam data: to display your profile, assign your rank, and show your progress on the platform.

We do not sell, rent, or share your data with third parties. Ever.`,
  },
  {
    title: 'Where your data is stored',
    text: `Data is stored in Supabase (PostgreSQL), hosted on AWS infrastructure in Europe. The platform code is fully open source — you can verify exactly what is stored and how at github.com/pantheon-hds/core.`,
  },
  {
    title: 'How to delete your data',
    text: `To remove yourself from the waitlist or delete your account entirely, contact us at pantheon.honor.democracy.skill@gmail.com. We will delete all your data within 7 days and confirm by email.`,
  },
  {
    title: 'Changes to this policy',
    text: `If we change this policy in a meaningful way, we will announce it on our Discord and GitHub. The history of all changes is visible in the open source repository.`,
  },
];

const LandingPrivacy: React.FC = () => {
  return (
    <LandingLayout>
      <div className="lfaq__page">
        <div className="lfaq__inner">
          <div className="lfaq__label">Legal</div>
          <h1 className="lfaq__title">Privacy Policy</h1>
          <div className="lfaq__subtitle">
            Plain language. No legal tricks. Last updated: April 2026.
          </div>

          <div className="lfaq__list">
            {sections.map((section, i) => (
              <div key={i} className="lfaq__item lfaq__item--open">
                <div className="lfaq__question" style={{ cursor: 'default', pointerEvents: 'none' }}>
                  <span>{section.title}</span>
                </div>
                <div className="lfaq__answer" style={{ whiteSpace: 'pre-line' }}>
                  {section.text}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingPrivacy;
