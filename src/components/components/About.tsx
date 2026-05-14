"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const founderStats = [
  { value: "3", suffix: " Years", label: "Building HoteloS" },
  { value: "12,000+", suffix: "", label: "Hotels Onboarded" },
  { value: "🇮🇳", suffix: "", label: "Built in India" },
];

export default function About() {
  return (
    <section id="about" className="py-12 sm:py-16 md:py-20 bg-[#FFF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-[#EA580C] text-xs sm:text-sm font-semibold mb-4 sm:mb-5">
              Hum kaun hain?
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111827] text-balance mb-4 sm:mb-6 leading-tight">
              Bangalore se,{" "}
              <span className="text-[#EA580C]">Bharat ke liye</span>
            </h2>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-6 sm:mb-8">
              HoteloS ek Indian team ne banaya hai jo hotels ki real problems samajhti hai.
              Hamare founders ne khud boutique hotels manage kiye hain aur woh frustration
              dekha hai jo ek hotel owner daily face karta hai. Isliye humne ek aisa platform
              banaya jo really India ke liye hai — GST se lekar WhatsApp tak.
            </p>

            {/* Founder Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {founderStats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-white rounded-xl p-4 sm:p-5 text-center border border-orange-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#EA580C] mb-1">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-base sm:text-lg md:text-xl font-bold text-[#EA580C]/80 ml-0.5">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">
                    {stat.label}
                  </div>
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
            className="relative order-1 lg:order-2"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80"
                alt="HoteloS team working together in Bangalore office"
                width={700}
                height={480}
                className="w-full h-auto object-cover aspect-[4/3] sm:aspect-[16/10]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/30 to-transparent" />
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-4 sm:-bottom-5 left-4 sm:left-6 bg-[#EA580C] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-base sm:text-lg">🇮🇳</span>
              <span className="hidden sm:inline">Bangalore se, Bharat ke liye</span>
              <span className="sm:hidden">Made in India</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}