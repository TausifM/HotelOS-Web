"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellValue = true | false | string;

const features = [
  { label: "AI Revenue Engine" },
  { label: "WhatsApp Native" },
  { label: "Channel Manager" },
  { label: "GST / GSTR-1 Export" },
  { label: "Loyalty PWA" },
  { label: "Banquet Module" },
  { label: "Express Checkout" },
  { label: "Pricing (India)" },
  { label: "Setup Time" },
  { label: "Hindi Support" },
];

const columns: { name: string; isUs: boolean; values: CellValue[] }[] = [
  {
    name: "HoteloS",
    isUs: true,
    values: [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      "₹1,500/mo",
      "2 minutes",
      true,
    ],
  },
  {
    name: "Hotelogix",
    isUs: false,
    values: [
      false,
      "Extra cost",
      "Extra cost",
      "Basic",
      false,
      false,
      false,
      "₹3,500+/mo",
      "1-2 weeks",
      false,
    ],
  },
  {
    name: "eZee",
    isUs: false,
    values: [
      false,
      false,
      "Extra cost",
      "Basic",
      false,
      "Extra cost",
      false,
      "₹4,000+/mo",
      "1 week",
      false,
    ],
  },
  {
    name: "Stayflexi",
    isUs: false,
    values: [
      "Basic",
      "Partial",
      true,
      false,
      false,
      false,
      "Basic",
      "₹3,000+/mo",
      "3-5 days",
      false,
    ],
  },
];

function Cell({ value, isUs }: { value: CellValue; isUs: boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${
            isUs ? "bg-green-100" : "bg-green-50"
          }`}
        >
          <Check className={`w-4 h-4 ${isUs ? "text-green-600" : "text-green-500"}`} />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
          <X className="w-4 h-4 text-red-400" />
        </div>
      </div>
    );
  }
  // string value
  return (
    <div className="flex justify-center">
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full ${
          isUs
            ? "bg-orange-100 text-[#EA580C]"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Comparison() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-[#111827] text-balance">
            HoteloS vs{" "}
            <span className="text-[#EA580C]">Baaki sab</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Side-by-side comparison — decide yourself
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm"
        >
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                  Feature
                </th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    className={`py-4 px-4 text-center text-sm font-black border-b border-gray-200 ${
                      col.isUs
                        ? "bg-[#EA580C] text-white"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {col.name}
                    {col.isUs && (
                      <span className="block text-xs font-normal text-orange-100 mt-0.5">
                        Recommended
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, fi) => (
                <tr
                  key={fi}
                  className={`border-b border-gray-100 last:border-0 ${
                    fi % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="py-3.5 px-6 text-sm font-medium text-[#111827]">
                    {feature.label}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      className={`py-3.5 px-4 ${
                        col.isUs ? "bg-orange-50/50" : ""
                      }`}
                    >
                      <Cell value={col.values[fi]} isUs={col.isUs} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
