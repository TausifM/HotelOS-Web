import Navbar from "@/components/components/Navbar";
import Hero from "@/components/components/Hero";
import Problem from "@/components/components/Problem";
import Features from "@/components/components/Features";
import HowItWorks from "@/components/components/HowItWorks";
import Stats from "@/components/components/Stats";
import Pricing from "@/components/components/Pricing";
import Testimonials from "@/components/components/Testimonials";
import Comparison from "@/components/components/Comparison";
import About from "@/components/components/About";
import FAQ from "@/components/components/FAQ";
import Contact from "@/components/components/Contact";
import CTABanner from "@/components/components/CTABanner";
import Footer from "@/components/components/Footer";
import WhatsAppButton from "@/components/components/WhatsAppButton";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FDFCFB] overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <Stats />
      <Pricing />
      <Testimonials />
      <Comparison />
      <About />
      <FAQ />
      <Contact />
      <CTABanner />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}