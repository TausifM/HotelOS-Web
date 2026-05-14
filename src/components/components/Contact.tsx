"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "+91 99757 67561",
    href: "tel:+919975767561",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@hotelos.online",
    href: "mailto:hello@hotelos.online",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Bangalore, Karnataka, India",
    href: null,
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "Mon-Sat 9AM-9PM IST",
    href: null,
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    hotelName: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Hotel inquiry from ${formData.name} — ${formData.hotelName}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nHotel: ${formData.hotelName}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:hello@hotelos.online?subject=${subject}&body=${body}`;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className="py-20 bg-[#FFF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            Baat karte hain —{" "}
            <span className="text-[#EA580C]">abhi</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Koi sawaal ho, demo chahiye, ya bas baat karni ho — hum ready hain.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                    Aapka naam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Rajesh Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rajesh@hotel.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-all"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                    Hotel ka naam
                  </label>
                  <input
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    placeholder="The Grand Hotel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Demo chahiye, ya koi sawaal hai..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-all resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-[#EA580C] text-white font-bold hover:bg-orange-700 transition-all hover:shadow-lg hover:shadow-orange-200 active:scale-95"
                >
                  {submitted ? "Message Sent!" : "Send Message"}
                </button>
                <a
                  href="https://wa.me/919975767561"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 rounded-xl bg-green-500 text-white font-bold text-center hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Ya WhatsApp karo
                </a>
              </div>
            </form>
          </motion.div>

          {/* Right: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            {contactInfo.map((info, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <info.icon className="w-5 h-5 text-[#EA580C]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                    {info.label}
                  </p>
                  {info.href ? (
                    <a
                      href={info.href}
                      className="font-semibold text-[#111827] hover:text-[#EA580C] transition-colors"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="font-semibold text-[#111827]">{info.value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* WhatsApp QR Placeholder */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-28 h-28 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-sm ${
                        [0, 2, 6, 8, 4].includes(i)
                          ? "bg-[#111827]"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm font-semibold text-[#111827]">WhatsApp QR Code</p>
              <p className="text-xs text-gray-400 mt-1">Scan to chat instantly</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
