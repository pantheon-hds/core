import React, { useState } from 'react';
import LandingLayout from '../layout/LandingLayout';
import './LandingFAQ.css';

const faqData = [
  {
    question: "Is my Steam account safe?",
    answer: "Yes. We use Steam OpenID, the same technology used by thousands of websites. We never receive your password. We only access your public profile: username, avatar, and achievement data. We cannot make purchases, access your inventory, or perform any actions on your account."
  },
  {
    question: "What data do you collect?",
    answer: "Only what Steam makes public: your Steam ID, username, avatar, and achievement completion percentages. We do not collect emails during Steam login, payment information, or any private data. The code is fully open source and you can verify everything yourself on GitHub."
  },
  {
    question: "Who are the judges and how do I become one?",
    answer: "Judges are experienced players who have earned Platinum rank in a game and applied through their Profile page. They watch submitted videos anonymously and vote independently. 2 of 3 approvals required. To apply, go to your Profile, scroll to the Judge section, and include a short note on why you want to judge."
  },
  {
    question: "Can I buy a rank?",
    answer: "No. Ranks cannot be purchased under any circumstances. Bronze through Gold are earned automatically via Steam achievements. Platinum and above require completing community challenges verified by real judges. Money has no place in this system and that will never change."
  },
  {
    question: "What happens if a Legend statue is revoked?",
    answer: "A Legend statue can only be revoked by a community vote, the same process that granted it. The admin cannot unilaterally remove a Legend statue. If a revocation happens, it will be announced publicly with a full explanation. This is part of our commitment to transparency."
  },
  {
    question: "The code is open source. Where can I see it?",
    answer: "The full platform code is available on GitHub at github.com/pantheon-hds/core. Anyone can read it, audit the security, and contribute improvements. We believe transparency is the only honest way to build a community platform."
  },
  {
    question: "How do I suggest a new game?",
    answer: "Join our Discord server and post in the #game-suggestions channel. Any game with Steam achievements can be added. The community discusses and votes on which games to add next."
  },
  {
    question: "How do I report a bug?",
    answer: "Two ways: open an issue on GitHub at github.com/pantheon-hds/core/issues, or post in the #bug-reports channel on Discord. Please include a description of what happened and what you expected to happen."
  },
];

const LandingFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <LandingLayout>
      <div className="lfaq__page">
        <div className="lfaq__inner">
          <div className="lfaq__label">Support</div>
          <h1 className="lfaq__title">Frequently Asked Questions</h1>
          <div className="lfaq__subtitle">
            Answers to the most common questions about Pantheon.
          </div>

          <div className="lfaq__list">
            {faqData.map((item, i) => (
              <div
                key={i}
                className={"lfaq__item" + (openIndex === i ? ' lfaq__item--open' : '')}
              >
                <button
                  className="lfaq__question"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-expanded={openIndex === i}
                >
                  <span>{item.question}</span>
                  <span className="lfaq__icon">{openIndex === i ? '−' : '+'}</span>
                </button>
                {openIndex === i && (
                  <div className="lfaq__answer">{item.answer}</div>
                )}
              </div>
            ))}
          </div>

          <div className="lfaq__footer">
            <div className="lfaq__footer-title">Still have questions?</div>
            <div className="lfaq__footer-links">
              <a href="https://discord.gg/pantheonhds" target="_blank" rel="noopener noreferrer" className="lfaq__footer-link">Discord</a>
              <a href="https://x.com/pantheonhds" target="_blank" rel="noopener noreferrer" className="lfaq__footer-link">X</a>
              <a href="https://github.com/pantheon-hds/core/issues" target="_blank" rel="noopener noreferrer" className="lfaq__footer-link">GitHub Issues</a>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingFAQ;
