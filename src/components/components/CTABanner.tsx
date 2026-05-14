"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function CTABanner() {
  return (
    <section className="py-20 bg-[#EA580C] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6">
            <Zap className="w-4 h-4 fill-white" />
            120 din bilkul free — no catch
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white text-balance mb-4">
            Aaj se shuru karo.
            <br />
            120 din{" "}
            <span className="text-white/80 italic">bilkul free.</span>
          </h2>

          <p className="text-white/80 text-xl mb-10">
            No credit card. No hidden fees. Cancel anytime.
          </p>

          <Link
            href="/register"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-[#EA580C] font-black text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl active:scale-95"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="mt-4 text-white/60 text-sm">
            hotelos.online/register
          </p>
        </motion.div>
      </div>
    </section>
  );
}
