"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Register karo",
    desc: "2 minutes mein account banao. Sirf email aur hotel name chahiye.",
    icon: "📝",
  },
  {
    number: "02",
    title: "Setup karo",
    desc: "Rooms, staff, OTA accounts connect karo. Hamare team help karegi.",
    icon: "⚙️",
  },
  {
    number: "03",
    title: "Grow karo",
    desc: "AI aapka kaam kar deta hai. Aap sirf results dekho.",
    icon: "🚀",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[#FFF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-[#EA580C] text-sm font-semibold mb-4">
            Shuru karna bahut aasaan hai
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            3 steps mein{" "}
            <span className="text-[#EA580C]">shuru karo</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#EA580C]/30 via-[#EA580C] to-[#EA580C]/30 z-0" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Circle */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-white border-4 border-[#EA580C] flex flex-col items-center justify-center shadow-lg shadow-orange-100 mb-6">
                  <span className="text-3xl">{step.icon}</span>
                </div>

                {/* Step number badge */}
                <div className="absolute top-0 right-4 md:right-6 w-7 h-7 rounded-full bg-[#EA580C] text-white text-xs font-black flex items-center justify-center">
                  {step.number}
                </div>

                {/* Arrow between steps */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-8 -right-4 z-20 w-8 h-8 items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-[#EA580C]" />
                  </div>
                )}

                <h3 className="text-xl font-black text-[#111827] mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-14"
        >
          <p className="text-gray-600 mb-4 text-base">
            Ya call karo — humara team setup mein help karega
          </p>
          <a
            href="https://wa.me/919975767561"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            +91 99757 67561 par WhatsApp karo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
