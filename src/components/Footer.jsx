import React, { useEffect, useState } from 'react';

export function Footer() {
  const [scrollPct, setScrollPct] = useState(0);
  const [hideHint, setHideHint] = useState(false);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      const pct = Math.round((y / (doc || 1)) * 100);
      setScrollPct(pct);
      setHideHint(y > window.innerHeight * 0.35);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Side Rails */}
      <div className="rail rail--left" aria-hidden="true">
        <span>雨隠れの里 · 暁の神 · 六道輪廻</span>
      </div>
      <div className="rail rail--right" aria-hidden="true">
        <span>GRAVITY {String(scrollPct).padStart(3, '0')}%</span>
      </div>

      {/* Floating Scroll Hint */}
      <div className={`hint ${hideHint ? 'hide' : ''}`} id="hint">
        <span className="hint__jp">下へスクロール</span>
        <span className="hint__line"></span>
        <span className="hint__en">SCROLL TO UNLEASH PAIN</span>
      </div>

      {/* Sticky Rinnegan Badge */}
      <div className="sticky-badge" id="stickyBadge">
        <span className="sticky-badge__jp">輪廻眼</span>
        <span className="sticky-badge__en">RINNEGAN · ACTIVE</span>
      </div>

      {/* Footer */}
      <footer id="end">
        <div className="footer__big">雨隠れの神</div>
        <div className="footer__row">
          <span>REALM OF GOD · AMEGAKURE</span>
          <span>暁 · AKATSUKI LEADER</span>
          <span>「この世界に、痛みを。」</span>
        </div>
      </footer>
    </>
  );
}
