"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const founderStats = [
  { value: "3 Years", label: "Building HoteloS" },
  { value: "12,000+", label: "Hotels Onboarded" },
  { value: "🇮🇳", label: "Built in India" },
];

export default function About() {
  return (
    <section id="about" className="py-20 bg-[#FFF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-[#EA580C] text-sm font-semibold mb-5">
              Hum kaun hain?
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance mb-6">
              Bangalore se,{" "}
              <span className="text-[#EA580C]">Bharat ke liye</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-8">
              HoteloS ek Indian team ne banaya hai jo hotels ki real problems samajhti hai.
              Hamare founders ne khud boutique hotels manage kiye hain aur woh frustration
              dekha hai jo ek hotel owner daily face karta hai. Isliye humne ek aisa platform
              banaya jo really India ke liye hai — GST se lekar WhatsApp tak.
            </p>

            {/* Founder Stat Cards */}
            <div className="grid grid-cols-3 gap-4">
              {founderStats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-white rounded-xl p-4 text-center border border-orange-100 shadow-sm"
                >
                  <div className="text-2xl font-black text-[#EA580C] mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80"
                alt="HoteloS team working together in Bangalore office"
                width={700}
                height={480}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/30 to-transparent" />
            </div>

            {/* Badge */}
            <div className="absolute -bottom-5 left-6 bg-[#EA580C] text-white px-5 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2">
              <span>🇮🇳</span>
              Bangalore se, Bharat ke liye
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
