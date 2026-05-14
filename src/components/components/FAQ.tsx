"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Kya 120 din free trial mein credit card chahiye?",
    a: "Bilkul nahi. Sirf email aur hotel details se shuru karo. Koi payment information required nahi hai.",
  },
  {
    q: "Kya main apna existing OTA data import kar sakta hoon?",
    a: "Haan, CSV import supported hai MakeMyTrip, Goibibo, Booking.com se. Hamare onboarding team aapki poori help karegi.",
  },
  {
    q: "Channel manager kaunse OTAs ko support karta hai?",
    a: "MakeMyTrip, Goibibo, Booking.com, Expedia, Airbnb, Agoda, Yatra, ixigo — aur continuously new OTAs add ho rahe hain.",
  },
  {
    q: "GST filing ke liye CA ko access de sakte hain?",
    a: "Haan, separate accountant login with limited access available hai. CA sirf GST reports aur invoices dekh sakta hai.",
  },
  {
    q: "Kya mobile app bhi hai?",
    a: "Web app fully mobile-responsive hai aur kisi bhi browser mein perfectly kaam karta hai. Native iOS/Android app coming 2025.",
  },
  {
    q: "Data secure hai?",
    a: "AWS India servers par hosted hai. SSL encrypted, daily automatic backups, SOC2 compliant. Aapka data India mein hi rehta hai.",
  },
  {
    q: "Kitne staff accounts bana sakte hain?",
    a: "Unlimited staff accounts with role-based permissions. 60+ granular permission settings available hain.",
  },
  {
    q: "Support kaise milta hai?",
    a: "WhatsApp support 9am-9pm IST, email support 24/7, aur Pro+ plans ke liye dedicated phone support bhi available hai.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            Aksar pooche jaane wale{" "}
            <span className="text-[#EA580C]">sawaal</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-[#111827] text-base pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-[#EA580C]" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
