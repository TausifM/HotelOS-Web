"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatItem {
  prefix?: string;
  target: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { target: 12000, suffix: "+", label: "Hotels Onboarded" },
  { prefix: "₹", target: 480, suffix: " Cr+", label: "Revenue Managed" },
  { target: 98.7, suffix: "%", label: "Uptime", decimals: 1 },
  { target: 4.9, suffix: "/5", label: "Average Rating", decimals: 1 },
];

function AnimatedCounter({ stat, active }: { stat: StatItem; active: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(eased * stat.target);
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(stat.target);
    };
    requestAnimationFrame(tick);
  }, [active, stat.target]);

  const formatted = stat.decimals
    ? count.toFixed(stat.decimals)
    : Math.floor(count).toLocaleString("en-IN");

  return (
    <span>
      {stat.prefix ?? ""}
      {formatted}
      {stat.suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 bg-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-white text-balance">
            Numbers jo bolte hain{" "}
            <span className="text-[#EA580C]">sab kuch</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-black text-[#EA580C] mb-2">
                <AnimatedCounter stat={stat} active={inView} />
              </div>
              <p className="text-gray-400 text-base font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
