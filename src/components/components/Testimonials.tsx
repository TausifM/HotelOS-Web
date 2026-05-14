"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Rajesh Sharma",
    hotel: "The Grand Residency, Jaipur",
    quote: "Pehle GST filing mein 2 din lagte the. Ab 10 minute mein ho jaata hai.",
    initials: "RS",
    color: "bg-orange-100 text-orange-700",
  },
  {
    name: "Priya Mehta",
    hotel: "Hotel Suncity, Nashik",
    quote: "Channel manager ne humara OTA revenue 40% badha diya pehle mahine mein.",
    initials: "PM",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Suresh Patel",
    hotel: "Patel Inn, Surat",
    quote:
      "WhatsApp automation se guests bahut khush hain. 4.8 star Google rating ho gayi.",
    initials: "SP",
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Anita Singh",
    hotel: "Hotel Himalaya View, Dehradun",
    quote:
      "Staff attendance aur payroll sab automatic. Bahut time bachta hai ab.",
    initials: "AS",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Mohammed Khan",
    hotel: "Al Noor Hotel, Hyderabad",
    quote: "MakeMyTrip sync itna aasaan! Double booking kabhi nahi hoti ab.",
    initials: "MK",
    color: "bg-teal-100 text-teal-700",
  },
  {
    name: "Deepika Nair",
    hotel: "Coconut Grove Resort, Goa",
    quote:
      "AI revenue feature ne peak season mein ₹3 lakh extra revenue diya.",
    initials: "DN",
    color: "bg-pink-100 text-pink-700",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-[#FFF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            12,000+ hotel owners{" "}
            <span className="text-[#EA580C]">trust HoteloS</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Tier 1 se Tier 3 tak — budget se luxury tak
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Quote marks */}
              <div className="text-5xl text-[#EA580C]/20 font-serif leading-none mb-2">&ldquo;</div>

              <p className="text-gray-700 leading-relaxed mb-6 text-base">{t.quote}</p>

              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${t.color} flex items-center justify-center font-bold text-sm shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.hotel}</p>
                </div>
                <div className="ml-auto">
                  <StarRating />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
