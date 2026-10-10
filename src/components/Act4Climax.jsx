import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function Act4Climax({ onPush, isPushing }) {
  return (
    <section className="climax" id="climax">
      <motion.div
        className="climax__container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="climax__badge">神の審判 · ULTIMATE JUTSU</div>
        <h2 className="climax__title">神羅天征を放て</h2>
        <p className="climax__desc">
          Trigger the omnidirectional repulsive blast that leveled Konohagakure. Feel the gravitational shockwave warp through the viewport.
        </p>

        <div className="climax__button-wrapper">
          <motion.button
            className="climax__btn interactive-hover"
            type="button"
            onClick={onPush}
            disabled={isPushing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="climax__btn-rings"></span>
            <span className="climax__btn-jp">神 羅 天 征</span>
            <span className="climax__btn-sub">
              {isPushing ? 'DETONATING...' : 'ALMIGHTY PUSH · ACTIVATE'}
            </span>
          </motion.button>
        </div>

        <div className="climax__status" id="climaxStatus">
          <span>
            {isPushing ? 'STATUS: 神羅天征 発動中 / ALMIGHTY PUSH DETONATING' : 'STATUS: 待機中 / STANDBY'}
          </span>
          <span className="climax__meter">
            <i
              style={{
                width: isPushing ? '0%' : '100%',
                transition: isPushing ? 'width 0.2s linear' : 'width 1.6s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            ></i>
          </span>
          <span>
            {isPushing ? 'GRAVITATIONAL POTENTIAL: DISCHARGED' : 'GRAVITATIONAL POTENTIAL: 100%'}
          </span>
        </div>
      </motion.div>
    </section>
  );
}
