import React from 'react';
import { Volume2, VolumeX, Zap } from 'lucide-react';

export function HeaderNav({ soundOn, toggleSound, onQuickPush }) {
  const navItems = [
    { href: '#scrub', jp: '覚醒', en: 'AWAKEN' },
    { href: '#eyes', jp: '瞳術', en: 'RINNEGAN' },
    { href: '#paths', jp: '六道', en: 'SIX PATHS' },
    { href: '#climax', jp: '天征', en: 'PUSH' },
    { href: '#quote', jp: '神言', en: 'TRUTH' },
  ];

  return (
    <header className="chrome">
      <div className="chrome__mark">
        <svg viewBox="0 0 100 100" className="rinnegan-mark" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="3.5" fill="var(--rinne-hot)" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="var(--blood-hot)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="chrome__title">
          <span className="chrome__title-main">PAIN</span>
          <span className="chrome__title-sub">雨隠れの里 · 暁</span>
        </div>
      </div>

      <nav className="chrome__nav">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} data-jp={item.jp}>
            {item.en}
          </a>
        ))}

        <button
          className="chrome__push-btn"
          type="button"
          onClick={onQuickPush}
          title="神羅天征を放つ (Almighty Push)"
        >
          <Zap size={13} className="btn-icon" />
          <span className="btn-jp">天征</span>
          <span className="btn-en">PUSH</span>
        </button>

        <button
          className="chrome__sound"
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          title="雨音と雷鳴 / Amegakure Audio"
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span className="chrome__sound-jp">雨音</span>
          <span className="chrome__sound-state">{soundOn ? 'ON' : 'OFF'}</span>
        </button>
      </nav>
    </header>
  );
}
