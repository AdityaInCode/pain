import React from 'react';
import { motion } from 'framer-motion';

export function Act5Philosophy() {
  return (
    <section className="quote" id="quote">
      <motion.div
        className="quote__jp"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        世界に痛みを<span className="dots">…</span>
      </motion.div>

      <motion.blockquote
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <p>
          “We are but men, drawn to act in the name of revenge that we deem to be justice. But when we hurt others in the name of justice, that same revenge breeds hatred in others. To know pain is to understand the only path to true peace.”
        </p>
        <cite>ペイン · 長門 · PAIN (NAGATO)</cite>
      </motion.blockquote>

      <motion.div
        className="quote__mark"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        「痛みを知らぬ者に、本当の平和は分からぬ。」
      </motion.div>
    </section>
  );
}
