import React, { useState } from 'react';
import './FAQ.css';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Pantheon HDS?",
    answer: "Pantheon is a community-driven achievement platform for players who love games deeply. Here, 100% Steam achievements is not the end - it's just the beginning. Players earn ranks by completing community-created challenges, verified by real players, not algorithms. Whether you are an elite speedrunner or a dedicated completionist — if you love games deeply, this is your home. Currently the Warrior path is available — challenges and ranks. Other paths (Teacher, Lorekeeper, Creator, Orator and more) are in active development."
  },
  {
    question: "Is my Steam account safe?",
    answer: "Absolutely. We use Steam OpenID — the same technology used by thousands of websites. We never receive your password. We only access your public profile data: username, avatar, and achievements. We cannot make purchases, access your inventory, or perform any actions on your account."
  },
  {
    question: "What data do you collect?",
    answer: "We collect only what Steam makes public: your Steam ID, username, avatar, and achievement data. We do not collect emails, payment information, or any private data. The code is open source — you can verify everything yourself."
  },
  {
    question: "How do ranks work?",
    answer: "Ranks are earned in two ways. First, automatically: connect Steam and we check your achievement completion percentage. 100% = Gold rank. Second, through challenges: complete community-created challenges verified by judges to earn Platinum, Diamond, Master, Grandmaster, and Legend ranks."
  },
  {
    question: "What are challenges?",
    answer: "Challenges are difficult tasks created by the community — things that go far beyond 100% achievements. Examples: 'Complete Hollow Knight Pantheon without taking damage' or 'Finish the game in under 2 hours'. You record a video, submit it, and judges verify it."
  },
  {
    question: "Who are the judges?",
    answer: "Judges are experienced players who have earned Gold rank in a game and applied to become judges. They watch submitted videos anonymously and vote on whether the challenge was completed correctly. 2 out of 3 judges must approve for a rank to be awarded."
  },
  {
    question: "How do I become a judge?",
    answer: "Go to your Profile page. If you have Platinum rank in any game and your account is at least 7 days old, you'll see the 'Become a Judge' section. Fill in your motivation and submit. The admin will review your application."
  },
  {
    question: "Is there any pay-to-win?",
    answer: "No. Absolutely not. Ranks cannot be purchased. Statues cannot be bought. The only path to Legend is through skill and community recognition. We accept voluntary support from players who believe in the project, but supporters receive no advantages whatsoever."
  },
  {
    question: "What games are supported?",
    answer: "Currently: Hollow Knight and Hollow Knight: Silksong. We are actively adding more games. The community decides which games to add next. Any game with Steam achievements can be added to the platform."
  },
  {
    question: "What is a Legend?",
    answer: "Legend is the highest rank on Pantheon. It can only be granted by community vote — not by the admin, not by judges alone. The first player to complete a legendary challenge receives the 'World First' flag permanently. Their statue stands in the Pantheon forever."
  },
  {
    question: "Is the code open source?",
    answer: "Yes. The entire platform code is open source on GitHub. Anyone can verify how it works, audit the security, and contribute improvements. We believe in radical transparency — if you don't trust us, check the code yourself."
  },
  {
    question: "How can I help?",
    answer: "Several ways: play and test the platform, report bugs, suggest challenges, apply to become a judge, contribute code on GitHub, or simply share the project with friends who might love it."
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq">
      <div className="faq__hero">
        <div className="faq__hero-title">About Pantheon</div>
        <div className="faq__hero-subtitle">
          Where 100% is just the beginning.
        </div>
        <div className="faq__hero-text">
          Pantheon is built by one person, for the community, with the community.
          No investors. No ads. No pay-to-win. Just skill, democracy, and honor.
        </div>
        <div className="faq__principles">
          <div className="faq__principle">
            <div className="faq__principle-title">Honor</div>
            <div className="faq__principle-text">Open source. No hidden mechanics. Verify everything yourself.</div>
          </div>
          <div className="faq__principle">
            <div className="faq__principle-title">Democracy</div>
            <div className="faq__principle-text">The community decides who is a Legend. Not algorithms. Not money.</div>
          </div>
          <div className="faq__principle">
            <div className="faq__principle-title">Skill</div>
            <div className="faq__principle-text">One path to the Pantheon. Mastery. Proven. Recognized. Eternal.</div>
          </div>
        </div>
      </div>

      <div className="faq__section-title">Frequently Asked Questions</div>

      <div className="faq__list">
        {faqData.map((item, index) => (
          <div
            key={index}
            className={"faq__item" + (openIndex === index ? ' faq__item--open' : '')}
          >
            <button
              className="faq__question"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span>{item.question}</span>
              <span className="faq__icon">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="faq__answer">{item.answer}</div>
            )}
          </div>
        ))}
      </div>

      <div className="faq__footer">
        <div className="faq__footer-title">Still have questions?</div>
        <div className="faq__footer-text">
          Join our Discord community or open an issue on GitHub.
        </div>
        <div className="faq__footer-links">
          <a href="https://github.com/pantheon-hds/core" target="_blank" rel="noopener noreferrer" className="faq__link">
            GitHub →
          </a>
          <a href="https://discord.gg/pantheonhds" target="_blank" rel="noopener noreferrer" className="faq__link">
            Discord →
          </a>
          <a href="https://reddit.com/r/PantheonHDS" target="_blank" rel="noopener noreferrer" className="faq__link">
            Reddit →
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
