import React from 'react';

export function Loader({ progress, isReady }) {
  if (isReady) return null;

  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div className={`loader ${progress >= 1 ? 'done' : ''}`} id="loader">
      <div className="loader__inner">
        <div className="loader__glyph">輪廻眼</div>
        <div className="loader__bar">
          <span style={{ width: `${pct}%` }}></span>
        </div>
        <div className="loader__meta">
          <span>神の領域 · INITIALIZING</span>
          <span>{String(pct).padStart(2, '0')}%</span>
        </div>
      </div>
    </div>
  );
}
