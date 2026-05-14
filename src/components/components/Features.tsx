"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "⚡",
    title: "AI Revenue Intelligence",
    desc: "IPL, weekends, festivals — rates auto-adjust. Avg 23% RevPAR lift.",
  },
  {
    icon: "💬",
    title: "WhatsApp Automation",
    desc: "Check-in links, checkout reminders, upsell offers — automatic.",
  },
  {
    icon: "🌐",
    title: "Channel Manager",
    desc: "MakeMyTrip, Booking.com, Goibibo, Airbnb — real-time sync.",
  },
  {
    icon: "🧾",
    title: "GSTR-1 Export",
    desc: "One-click JSON + Excel. CA khush, aap khush.",
  },
  {
    icon: "⭐",
    title: "Guest Loyalty PWA",
    desc: "Guests track points, request services, express checkout on phone.",
  },
  {
    icon: "🎪",
    title: "Banquet & Events",
    desc: "Halls, catering, deposits — hotel rooms se alag manage karo.",
  },
  {
    icon: "🔑",
    title: "Express Checkout",
    desc: "Guest apne phone se bill dekhe, pay kare, checkout kare.",
  },
  {
    icon: "👥",
    title: "Staff Management",
    desc: "60+ granular permissions. Role-based access. Attendance + payroll.",
  },
  {
    icon: "📦",
    title: "Inventory Tracking",
    desc: "Linen, toiletries, minibar — low stock alerts automatically.",
  },
  {
    icon: "🍽️",
    title: "Restaurant POS",
    desc: "Dine-in, takeaway, in-room dining QR — folio mein auto-post.",
  },
  {
    icon: "🔍",
    title: "OCR ID Verification",
    desc: "Aadhaar, passport scan — guest ID auto-fill in seconds with 100% accuracy.",
  },
  {
    icon: "📊",
    title: "Smart Reports",
    desc: "Daily business, revenue analysis, police register — sab.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-[#EA580C] text-sm font-semibold border border-orange-100 mb-4">
            Ab HoteloS ke saath
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            Ek platform.{" "}
            <span className="text-[#EA580C]">Sab kuch.</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
            12 powerful modules — sab kuch ek jagah manage karo. No jugaad, no shortcuts.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#EA580C]/30 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-[#EA580C]/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-bold text-[#111827] text-base mb-1.5">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
