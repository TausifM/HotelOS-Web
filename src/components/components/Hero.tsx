"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function CountUp({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-[#FDFCFB]"
    >
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-20 right-[-100px] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #EA580C 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-[-80px] w-[350px] h-[350px] rounded-full opacity-8"
        style={{ background: "radial-gradient(circle, #EA580C 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] text-sm font-medium mb-6"
            >
              <Zap className="w-3.5 h-3.5 fill-[#EA580C]" />
              India&apos;s #1 Hotel Management OS
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#111827] leading-[1.05] tracking-tight text-balance mb-4"
            >
              Hotel chalana
              <br />
              hua{" "}
              <span className="text-[#EA580C] italic font-black">aasaan.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg"
            >
              India&apos;s smartest hotel management platform. AI revenue, WhatsApp automation,
              channel manager, GST filing — sab ek jagah.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#EA580C] text-white font-bold text-base hover:bg-orange-700 transition-all hover:shadow-lg hover:shadow-orange-200 active:scale-95"
              >
                Start 4-Month Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-[#111827] text-[#111827] font-bold text-base hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-[#111827] flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
                Watch Demo
              </button>
            </motion.div>

            {/* Trust Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-4 sm:gap-6"
            >
              {[
                { icon: "⚡", text: (<><CountUp target={12000} />+ hotels onboarded</>) },
                { icon: "🇮🇳", text: "Made in India" },
                { icon: "🗓️", text: "120 days free trial" },
                { icon: "💳", text: "No credit card" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Dashboard Image */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-orange-100 border border-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                alt="HoteloS Hotel Management Dashboard"
                width={800}
                height={520}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/20 to-transparent" />

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Revenue This Month</p>
                  <p className="text-lg font-bold text-[#111827]">₹4,82,300</p>
                </div>
              </motion.div>

              {/* Floating AI badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute top-4 right-4 bg-[#EA580C] text-white rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span className="text-xs font-bold">AI Revenue +23%</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
