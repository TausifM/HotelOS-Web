"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: "📒",
    text: "Paper register mein guest details likhna",
    desc: "Manual entries, lost data, no search — pure time wastage.",
  },
  {
    icon: "😤",
    text: "Teen alag OTA extranets manually update karna",
    desc: "MakeMyTrip, Booking.com, Goibibo — ek ek karke rates update karo.",
  },
  {
    icon: "😰",
    text: "GST filing ke time CA ke paas bhaagna",
    desc: "Quarter end mein panic mode. Bills dhundho, CA ko do.",
  },
  {
    icon: "📞",
    text: "Double booking — do guests, ek room",
    desc: "Embarrassing situations, bad reviews, revenue loss.",
  },
  {
    icon: "⏰",
    text: "Midnight mein rate changes manually karna",
    desc: "IPL match hai, festival hai — rates update karna reh gaya.",
  },
  {
    icon: "💸",
    text: "Revenue leak — pata hi nahi kahan se ja raha paise",
    desc: "No reports, no visibility, no control on your own business.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Problem() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 bg-[#FFF5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-600 text-sm font-medium mb-4">
            <AlertTriangle className="w-4 h-4" />
            Kya yeh problems aapke hotel mein hain?
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            Pehle kya hota tha?
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
            Ye saari problems har Indian hotel owner face karta hai. Ab nahi karna.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="relative bg-white rounded-2xl p-6 border-l-4 border-red-400 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0 mt-0.5">{problem.icon}</div>
                <div>
                  <p className="font-bold text-[#111827] text-base leading-snug mb-1">
                    {problem.text}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">{problem.desc}</p>
                </div>
              </div>
              {/* Warning badge */}
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA hook */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-xl font-bold text-[#111827]">
            Yeh sab problems{" "}
            <span className="text-[#EA580C] italic">ek hi platform</span> se solve ho sakti hain.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
