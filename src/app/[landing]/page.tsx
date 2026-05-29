import { Metadata } from "next";
import { notFound } from "next/navigation";
import { landingPages, landingSlugs } from "@/lib/landing-data";

import Navbar from "@/components/components/Navbar";
import Pricing from "@/components/components/Pricing";
import Testimonials from "@/components/components/Testimonials";
import Comparison from "@/components/components/Comparison";
import About from "@/components/components/About";
import Contact from "@/components/components/Contact";
import Footer from "@/components/components/Footer";
import WhatsAppButton from "@/components/components/WhatsAppButton";
import Link from "next/link";

interface Props {
  params: Promise<{ landing: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { landing } = await params;
  const config = landingPages[landing];
  if (!config) return {};

  return {
    title: `${config.title} | Hotelos`,
    description: config.description,
    keywords: [
      "hotelos",
      "hotel os",
      "hotel operating system",
      "hotel os software",
      "hotelos online",
      "hotel management software India",
      "cloud hotel PMS",
      ...config.keywords,
    ],
    alternates: { canonical: config.canonical },
    openGraph: {
      title: config.ogTitle,
      description: config.ogDescription,
      url: config.canonical,
      siteName: "Hotelos",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: `https://hotelos.online/og-${landing}.jpg`,
          width: 1200,
          height: 630,
          alt: config.heroTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.ogTitle,
      description: config.ogDescription,
      images: [`https://hotelos.online/og-${landing}.jpg`],
      creator: "@Hotelos",
      site: "@Hotelos",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export async function generateStaticParams() {
  return landingSlugs.map((slug) => ({ landing: slug }));
}

export default async function LandingPage({ params }: Props) {
  const { landing } = await params;
  const config = landingPages[landing];
  if (!config) notFound();

  // Keyword-rich brand statement injected on every landing page
  const brandStatement = `Hotelos (hotelos.online) is India's leading hotel operating system — a complete hotel OS software trusted by 12,000+ hotels.`;

  return (
    <main className="min-h-screen bg-[#FDFCFB] overflow-x-hidden">
      {/* ===== Organization Schema (injected on every landing page) ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Hotelos",
            alternateName: ["Hotel OS", "hotelos.online", "Hotel Operating System"],
            url: "https://hotelos.online",
            logo: "https://hotelos.online/logo.png",
            sameAs: [
              "https://twitter.com/Hotelos",
              "https://linkedin.com/company/hotelos",
              "https://facebook.com/Hotelos",
              "https://instagram.com/Hotelos",
            ],
          }),
        }}
      />

      {/* ===== SoftwareApplication Schema ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Hotelos",
            alternateName: "Hotel OS Software",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: "India's smartest hotel operating system with AI revenue intelligence, WhatsApp automation, and GST billing.",
            url: "https://hotelos.online",
            offers: {
              "@type": "Offer",
              price: "1500",
              priceCurrency: "INR",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: "1500",
                priceCurrency: "INR",
                unitText: "MONTH",
              },
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              ratingCount: "12000",
            },
          }),
        }}
      />

      {/* ===== FAQPage Schema ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: config.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* ===== BreadcrumbList Schema ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Hotelos",
                item: "https://hotelos.online",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: config.heroTitle,
                item: config.canonical,
              },
            ],
          }),
        }}
      />

      <Navbar />

      {/* ===== DYNAMIC HERO ===== */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            {config.heroTitle}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {config.heroSubtitle}
          </p>
          {/* Brand keyword ribbon */}
          <p className="mt-4 text-sm text-gray-500 max-w-2xl mx-auto">
            {brandStatement}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition"
            >
              Start Free Trial
            </Link>
            <a
              href="/demo"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* ===== KEYWORD CONTEXT SECTION (NEW) ===== */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-orange-50 border-y border-orange-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-700 leading-relaxed">
            Looking for a <strong>hotel operating system</strong>? {" "}
            <Link href="https://hotelos.online" className="text-orange-700 font-semibold hover:underline">
              Hotelos
            </Link>{" "}
            is the all-in-one <strong>hotel OS software</strong> built for Indian hotels. Whether you search for {" "}
            <strong>hotelos online</strong>, <strong>hotel OS</strong>, or <strong>hotel operating system</strong>, you are in the right place.
          </p>
        </div>
      </section>

      {/* ===== DYNAMIC PROBLEM ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            {config.problemTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {config.problemPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100"
              >
                <span className="text-red-500 text-xl mt-0.5">✕</span>
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DYNAMIC FEATURES ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Built specifically for Indian hospitality businesses using the Hotelos hotel operating system
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DYNAMIC HOW IT WORKS ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {config.howItWorksSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DYNAMIC STATS ===== */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-orange-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {config.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-orange-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Static components */}
      <Pricing />
      <Testimonials />
      <Comparison />
      <About />

      {/* ===== DYNAMIC FAQ ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {config.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-200 bg-white open:ring-1 open:ring-orange-200"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-left font-medium text-gray-900">
                  {faq.question}
                  <span className="ml-4 text-orange-500 group-open:rotate-180 transition">
                    ▼
                  </span>
                </summary>
                <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Contact />

      {/* ===== DYNAMIC CTA BANNER ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.ctaTitle}
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            {config.ctaSubtitle}
          </p>
          {/* Internal link to homepage with exact brand anchor */}
          <p className="mb-6 text-gray-400 text-sm">
            Powered by{" "}
            <Link href="https://hotelos.online" className="text-orange-400 hover:underline">
              Hotelos — Hotel OS Software
            </Link>
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-orange-700 bg-white rounded-lg hover:bg-gray-100 transition"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}