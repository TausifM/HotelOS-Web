"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 1500,
    annualPrice: 1250,
    rooms: "Up to 20 rooms",
    popular: false,
    cta: "Start Free Trial",
    ctaHref: "/auth/register",
    features: [
      "All core modules",
      "WhatsApp notifications",
      "GST invoicing",
      "Reports dashboard",
      "Email support",
      "120-day free trial",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: 2500,
    annualPrice: 2083,
    rooms: "Up to 50 rooms",
    popular: true,
    cta: "Start Free Trial",
    ctaHref: "/auth/register",
    features: [
      "Everything in Starter",
      "AI Revenue Intelligence",
      "Rate Calendar",
      "Booking Engine",
      "Loyalty Program",
      "Priority support",
      "120-day free trial",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 4000,
    annualPrice: 3333,
    rooms: "Unlimited rooms",
    popular: false,
    cta: "Start Free Trial",
    ctaHref: "/auth/register",
    features: [
      "Everything in Growth",
      "White-label branding",
      "Channel Manager",
      "Custom branding",
      "API access",
      "Dedicated support",
      "120-day free trial",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    rooms: "Multi-property",
    popular: false,
    cta: "Contact Sales",
    ctaHref: "#contact",
    features: [
      "Everything in Pro",
      "SLA guarantee",
      "On-site training",
      "FRRO integration",
      "Tally export",
      "Custom contracts",
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            Simple pricing.{" "}
            <span className="text-[#EA580C]">No surprises.</span>
          </h2>
          <p className="mt-3 text-green-500 text-xl">
            <strong>120-day free trial</strong> — no subscription required.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-semibold ${!annual ? "text-[#111827]" : "text-gray-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              annual ? "bg-[#EA580C]" : "bg-gray-200"
            }`}
            aria-label="Toggle annual pricing"
          >
            <motion.div
              layout
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
              animate={{ left: annual ? "calc(100% - 24px)" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-semibold ${annual ? "text-[#111827]" : "text-gray-400"}`}>
            Annual
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              2 months free
            </span>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "border-2 border-[#EA580C] shadow-xl shadow-orange-100 scale-[1.02]"
                  : "border border-gray-200 shadow-sm"
              } bg-white`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#EA580C] text-white text-xs font-black whitespace-nowrap shadow">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-black text-[#111827] mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.rooms}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={annual ? "annual" : "monthly"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {plan.monthlyPrice ? (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-[#111827]">
                          ₹{(annual ? plan.annualPrice! : plan.monthlyPrice).toLocaleString("en-IN")}
                        </span>
                        <span className="text-gray-400 text-sm mb-1">/month</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black text-[#111827]">Custom</div>
                    )}
                    {annual && plan.monthlyPrice && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Billed annually — 2 months free
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${
                  plan.popular
                    ? "bg-[#EA580C] text-white hover:bg-orange-700 shadow-lg shadow-orange-200"
                    : "bg-gray-50 text-[#111827] border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Sabhi plans mein 120-day free trial included hai. Koi credit card nahi chahiye.
        </p>
      </div>
    </section>
  );
}
