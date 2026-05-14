export interface LandingPageConfig {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  problemTitle: string;
  problemPoints: string[];
  features: { title: string; description: string }[];
  howItWorksSteps: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  ctaTitle: string;
  ctaSubtitle: string;
}

export const landingPages: Record<string, LandingPageConfig> = {
  "hotel-pms-india": {
    slug: "hotel-pms-india",
    title: "Hotel PMS India | Cloud Property Management System — HoteloS",
    description:
      "HoteloS is the #1 cloud hotel PMS in India. Manage reservations, front desk, housekeeping & night audit from any device. Free demo. Plans from ₹1,500/month.",
    keywords: [
      "hotel PMS India",
      "cloud property management system",
      "hotel front desk software India",
      "hotel reservation system India",
      "hotel operations platform",
      "hotel check-in software",
      "hotel night audit software",
      "hotel housekeeping software",
      "hotel staff management software",
      "hotel ERP India",
      "best hotel PMS 2025",
      "hotel PMS free trial India",
      "hotel PMS demo",
      "affordable hotel PMS",
      "small hotel PMS India",
      "HoteloS PMS",
      "hotel software",
      "hotel app",
      "hotel system",
      "PMS software",
      "PMS app",
      "hotel management app",
      "hotel system India",
      "hotel software India",
      "PMS India",
      "hotel PMS India",
      "cloud hotel app",
      "hotel web app",
      "hotel mobile app",
      "hotel tablet app",
      "hotel online system",
      "hotel cloud system",
      "hotel web system",
      "hotel software price",
      "hotel software cost",
      "hotel software buy",
      "hotel software demo",
      "hotel software trial",
      "hotel software free",
      "hotel software login",
      "hotel software signup",
      "hotel software download",
      "hotel software install",
      "hotel software setup",
      "hotel software dashboard",
      "hotel software panel",
      "hotel software portal",
      "hotel software tool",
      "hotel software solution",
      "hotel software platform",
      "hotel software company",
      "hotel software provider",
      "hotel software vendor",
      "hotel PMS price",
      "hotel PMS cost",
      "hotel PMS demo",
      "hotel PMS trial",
      "hotel PMS free",
      "cloud PMS India",
      "web PMS India",
      "online PMS India",
      "digital hotel system",
      "smart hotel app",
      "hotel automation app",
      "hotel tech India",
      "hotel IT solution",
      "hotel digital solution",
      "hotel software Nagpur",
      "hotel software Mumbai",
      "hotel software Delhi",
      "hotel software Bangalore",
      "hotel software Chennai",
      "hotel software Pune",
      "hotel software Hyderabad",
      "hotel software Kolkata",
      "hotel software Jaipur",
      "hotel software Goa",
      "hotel software Kerala",
    ],
    canonical: "https://hotelos.online/hotel-pms-india",
    ogTitle: "Hotel PMS India | Cloud Property Management System — HoteloS",
    ogDescription:
      "India's most trusted cloud hotel PMS. Reservations, front desk, housekeeping & night audit from any device.",
    heroTitle: "India's Most Trusted Cloud Hotel PMS",
    heroSubtitle:
      "Manage reservations, front desk, housekeeping & night audit from any device. Built for Indian hotels, resorts & guest houses.",
    problemTitle:
      "Still managing your hotel with spreadsheets and diary books?",
    problemPoints: [
      "Double bookings from manual entry errors",
      "No real-time view of room availability",
      "Lost revenue from missed upsell opportunities",
      "Hours wasted on night audit and reconciliation",
    ],
    features: [
      {
        title: "Real-Time Reservations",
        description:
          "Centralized reservation diary with instant room availability, walk-in bookings, and group reservations.",
      },
      {
        title: "Front Desk Operations",
        description:
          "Streamlined check-in/check-out, ID scanning, key card integration, and guest profile management.",
      },
      {
        title: "Housekeeping Module",
        description:
          "Automated room status updates, task assignment, and maintenance tracking with mobile alerts.",
      },
      {
        title: "Night Audit & Reports",
        description:
          "One-click night audit with daily revenue reports, occupancy analytics, and manager summaries.",
      },
      {
        title: "Multi-Property Dashboard",
        description:
          "Manage multiple hotels, resorts, or guest houses from a single unified dashboard.",
      },
      {
        title: "Staff Management",
        description:
          "Role-based access, shift scheduling, and activity logs for complete operational control.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Sign up in 2 minutes",
        description: "Create your hotel profile and add your rooms.",
      },
      {
        title: "Import your bookings",
        description:
          "Migrate from any existing system with our free onboarding.",
      },
      {
        title: "Go live",
        description:
          "Start managing reservations, front desk, and billing from one dashboard.",
      },
    ],
    stats: [
      { label: "Hotels using HoteloS", value: "12,000+" },
      { label: "Average setup time", value: "24 hrs" },
      { label: "Uptime guarantee", value: "99.9%" },
      { label: "Support languages", value: "Hindi + English" },
    ],
    faqs: [
      {
        question: "What is a Hotel PMS?",
        answer:
          "A Hotel Property Management System (PMS) is software that manages daily hotel operations including reservations, front desk, room assignments, housekeeping, billing, and reporting.",
      },
      {
        question: "Why is HoteloS the best hotel PMS in India?",
        answer:
          "HoteloS is built specifically for Indian hotels with GST-compliant billing, regional OTA integrations, WhatsApp automation, and pricing starting at just ₹1,500/month.",
      },
      {
        question: "Can I use HoteloS PMS on mobile?",
        answer:
          "Yes. HoteloS is a fully cloud-based hotel PMS that works on desktops, tablets, and smartphones with real-time sync across all devices.",
      },
      {
        question: "Does HoteloS PMS support multiple properties?",
        answer:
          "Absolutely. HoteloS supports single hotels, multi-property chains, resorts, guest houses, and serviced apartments under one dashboard.",
      },
      {
        question: "How quickly can I switch from my current PMS?",
        answer:
          "Our onboarding team migrates your data within 24-48 hours. We offer free training and 24/7 support during the transition.",
      },
    ],
    ctaTitle: "Ready to Upgrade Your Hotel Operations?",
    ctaSubtitle:
      "Join 12,000+ Indian hotels using HoteloS PMS. Free 120-days trial. No credit card required.",
  },

  "channel-manager": {
    slug: "channel-manager",
    title: "Hotel Channel Manager India | OTA Integration — HoteloS",
    description:
      "Sync rates & availability across Booking.com, MakeMyTrip, Goibibo, Agoda & 50+ OTAs in real time. HoteloS channel manager prevents overbooking and maximizes revenue.",
    keywords: [
      "hotel channel manager India",
      "OTA integration software",
      "hotel distribution system",
      "hotel OTA connectivity",
      "hotel real-time availability",
      "hotel two-way sync",
      "hotel overbooking protection",
      "hotel rate parity software",
      "hotel meta search integration",
      "hotel GDS integration",
      "Booking.com channel manager",
      "MakeMyTrip integration",
      "Goibibo channel manager",
      "Agoda integration India",
      "hotel inventory sync",
      "best channel manager India",
      "affordable channel manager",
      "HoteloS channel manager",
      "channel manager",
      "OTA manager",
      "booking sync",
      "hotel channel",
      "hotel OTA",
      "hotel distribution",
      "hotel sync",
      "hotel connectivity",
      "hotel channel app",
      "hotel OTA app",
      "channel manager India",
      "OTA manager India",
      "hotel channel software",
      "hotel OTA software",
      "hotel distribution app",
      "hotel distribution software",
      "hotel channel price",
      "hotel channel cost",
      "hotel channel demo",
      "hotel channel trial",
      "hotel channel free",
      "OTA sync",
      "booking channel",
      "hotel extranet",
      "hotel channel login",
      "hotel channel signup",
      "hotel channel dashboard",
      "hotel channel panel",
      "hotel channel portal",
      "hotel channel tool",
      "hotel channel solution",
      "hotel channel platform",
      "hotel channel company",
      "hotel channel provider",
      "hotel channel vendor",
      "MakeMyTrip sync",
      "Goibibo sync",
      "Booking.com sync",
      "Agoda sync",
      "Expedia sync",
      "OYO sync",
      "hotel rate sync",
      "hotel price sync",
      "hotel inventory sync",
      "hotel availability sync",
      "hotel booking sync",
      "hotel reservation sync",
      "hotel room sync",
      "hotel rate manager",
      "hotel price manager",
      "hotel inventory manager",
      "hotel availability manager",
    ],
    canonical: "https://hotelos.online/channel-manager",
    ogTitle: "Hotel Channel Manager India | OTA Integration — HoteloS",
    ogDescription:
      "Real-time OTA sync across Booking.com, MakeMyTrip, Goibibo, Agoda & 50+ channels. No more overbooking.",
    heroTitle: "India's Smartest Hotel Channel Manager",
    heroSubtitle:
      "Real-time OTA sync across Booking.com, MakeMyTrip, Goibibo, Agoda & 50+ channels. Eliminate overbooking. Maximize occupancy.",
    problemTitle: "Tired of overbooking and manual rate updates across OTAs?",
    problemPoints: [
      "Double bookings from delayed inventory updates",
      "Manually changing rates on 5+ OTA extranets daily",
      "Rate parity violations leading to OTA penalties",
      "Lost revenue when one channel sells out while others are empty",
    ],
    features: [
      {
        title: "Real-Time Two-Way Sync",
        description:
          "Inventory updates pushed to all OTAs within 30 seconds. Bookings from any channel instantly reflect in your PMS.",
      },
      {
        title: "Overbooking Protection",
        description:
          "Pooled inventory with automated stop-sell triggers. Never get penalized for double bookings again.",
      },
      {
        title: "Rate Parity Control",
        description:
          "Set different rates per OTA, apply markups, and maintain rate parity with automated rules.",
      },
      {
        title: "50+ OTA Connections",
        description:
          "Native integrations with Booking.com, MakeMyTrip, Goibibo, Agoda, Expedia, Yatra, Cleartrip & Airbnb.",
      },
      {
        title: "Bulk Rate Updates",
        description:
          "Update rates for all channels simultaneously or schedule seasonal pricing changes in advance.",
      },
      {
        title: "Analytics & Insights",
        description:
          "Track which OTAs drive the most revenue, compare commission costs, and optimize your distribution mix.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Connect your OTAs",
        description:
          "Link Booking.com, MakeMyTrip, Goibibo, Agoda & more in one click.",
      },
      {
        title: "Set your rules",
        description: "Define rate parity, markups, and stop-sell thresholds.",
      },
      {
        title: "Auto-sync 24/7",
        description:
          "HoteloS updates inventory and rates across all channels every 30 seconds.",
      },
    ],
    stats: [
      { label: "OTA integrations", value: "50+" },
      { label: "Sync speed", value: "30 sec" },
      { label: "Overbooking reduction", value: "99%" },
      { label: "Uptime", value: "99.9%" },
    ],
    faqs: [
      {
        question: "What is a hotel channel manager?",
        answer:
          "A channel manager is software that automatically updates room rates and availability across all your connected OTAs (Booking.com, MakeMyTrip, etc.) in real time to prevent overbooking.",
      },
      {
        question: "Which OTAs does HoteloS integrate with?",
        answer:
          "HoteloS connects with 50+ OTAs including Booking.com, MakeMyTrip, Goibibo, Agoda, Expedia, TripAdvisor, Yatra, Cleartrip, and Airbnb.",
      },
      {
        question: "How fast is the sync?",
        answer:
          "HoteloS updates inventory across all channels within 30 seconds of any booking or rate change.",
      },
      {
        question: "Can I set different rates for different OTAs?",
        answer:
          "Yes. HoteloS supports rate parity rules, OTA-specific pricing, and dynamic markup strategies to maximize revenue per channel.",
      },
      {
        question: "Will it prevent double bookings?",
        answer:
          "Absolutely. Our two-way sync and pooled inventory model ensure a room is never double-booked across channels.",
      },
    ],
    ctaTitle: "Stop Losing Bookings to Overbooking",
    ctaSubtitle:
      "Connect your hotel to 50+ OTAs with HoteloS channel manager. Free 120-days trial.",
  },

  "gst-billing-software": {
    slug: "gst-billing-software",
    title: "GST Billing Software for Hotels | Invoice & Tax Filing — HoteloS",
    description:
      "GST-compliant hotel billing software with auto-tax calculation, e-invoicing, GSTR-1/GSTR-3B reports & POS integration. HoteloS simplifies hotel tax compliance in India.",
    keywords: [
      "GST billing software for hotels",
      "hotel billing software GST",
      "hotel invoice software India",
      "GST compliant hotel software",
      "hotel tax software India",
      "hotel e-invoicing software",
      "GSTR-1 hotel software",
      "GSTR-3B hotel software",
      "hotel POS GST integration",
      "hotel invoice generator",
      "hotel receipt software",
      "hotel folio software",
      "hotel checkout billing",
      "restaurant billing software GST",
      "hotel accounting software India",
      "hotel finance software",
      "hotel tax filing automation",
      "HoteloS billing",
      "hotel billing",
      "hotel GST",
      "hotel invoice",
      "hotel tax",
      "hotel receipt",
      "hotel folio",
      "hotel payment",
      "hotel UPI",
      "hotel billing app",
      "hotel GST app",
      "hotel invoice app",
      "hotel billing software",
      "hotel GST software",
      "hotel invoice software",
      "hotel billing India",
      "hotel GST India",
      "hotel invoice India",
      "hotel tax India",
      "hotel receipt India",
      "hotel folio India",
      "hotel payment India",
      "hotel UPI India",
      "hotel billing price",
      "hotel billing cost",
      "hotel billing demo",
      "hotel billing trial",
      "hotel billing free",
      "hotel GST price",
      "hotel GST cost",
      "hotel GST demo",
      "hotel GST trial",
      "hotel GST free",
      "hotel invoice price",
      "hotel invoice cost",
      "hotel invoice demo",
      "hotel invoice trial",
      "hotel invoice free",
      "hotel tax software",
      "hotel tax app",
      "hotel receipt app",
      "hotel folio app",
      "hotel payment app",
      "hotel UPI app",
      "hotel wallet app",
      "hotel billing login",
      "hotel billing signup",
      "hotel billing dashboard",
      "hotel billing panel",
      "hotel billing portal",
      "hotel billing tool",
      "hotel billing solution",
      "hotel billing platform",
      "hotel billing company",
      "hotel billing provider",
      "hotel billing vendor",
      "GST hotel",
      "GST filing hotel",
      "GST return hotel",
      "GST invoice hotel",
      "GST bill hotel",
      "GST receipt hotel",
      "GST payment hotel",
    ],
    canonical: "https://hotelos.online/gst-billing-software",
    ogTitle: "GST Billing Software for Hotels | Invoice & Tax Filing — HoteloS",
    ogDescription:
      "Auto GST calculation, e-invoicing, GSTR reports & POS integration. Simplify hotel tax compliance with HoteloS.",
    heroTitle: "GST Billing Software Built for Indian Hotels",
    heroSubtitle:
      "Auto-calculate GST, generate e-invoices, file GSTR-1/GSTR-3B reports & integrate POS billing. Tax compliance made effortless.",
    problemTitle:
      "Spending hours on GST calculations and tax filing every month?",
    problemPoints: [
      "Manual GST calculation errors on every invoice",
      "Missing GSTR-1 and GSTR-3B deadlines",
      "No e-invoicing support for B2B corporate guests",
      "Separate billing systems for rooms, restaurant, and room service",
    ],
    features: [
      {
        title: "Auto GST Calculation",
        description:
          "Automatic tax computation with correct HSN codes, SAC mapping, and multi-rate GST support for rooms, F&B, and services.",
      },
      {
        title: "E-Invoicing Integration",
        description:
          "Direct integration with the government e-invoice portal. Auto-generate IRN, QR codes, and digitally signed invoices.",
      },
      {
        title: "GSTR Reports",
        description:
          "One-click generation of GSTR-1 (outward supplies) and GSTR-3B summary reports ready for direct GST portal upload.",
      },
      {
        title: "Split Folio & Corporate Billing",
        description:
          "Separate guest charges from company payments, handle travel agent commissions, and manage direct billing accounts.",
      },
      {
        title: "Integrated POS Billing",
        description:
          "Restaurant, room service, and minibar billing with the same GST engine. One guest, one unified bill.",
      },
      {
        title: "Multi-Property Consolidation",
        description:
          "Consolidate GST data across multiple hotels under one GSTIN or manage separate registrations per property.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Enable GST profile",
        description: "Set your GSTIN, HSN codes, and tax rates once.",
      },
      {
        title: "Bill automatically",
        description:
          "Every invoice auto-calculates GST with correct rates and codes.",
      },
      {
        title: "File in one click",
        description:
          "Export GSTR-1 and GSTR-3B reports ready for GST portal upload.",
      },
    ],
    stats: [
      { label: "GST invoices generated", value: "5M+" },
      { label: "Tax filing time saved", value: "8 hrs/mo" },
      { label: "E-invoicing ready", value: "100%" },
      { label: "GST compliance", value: "Full" },
    ],
    faqs: [
      {
        question: "Is HoteloS GST compliant?",
        answer:
          "Yes. HoteloS is fully GST-compliant with automatic tax calculation, HSN code mapping, multi-rate GST support (5%, 12%, 18%, 28%), and e-invoicing integration.",
      },
      {
        question: "Can HoteloS generate GSTR-1 and GSTR-3B reports?",
        answer:
          "Absolutely. HoteloS auto-generates GSTR-1 (outward supplies) and GSTR-3B summary reports in the exact format required for GST portal filing.",
      },
      {
        question: "Does it support e-invoicing under GST?",
        answer:
          "Yes. HoteloS integrates with the government e-invoice portal to generate IRN and QR codes for B2B invoices automatically.",
      },
      {
        question: "Can I split bills between guests and companies?",
        answer:
          "Yes. HoteloS supports split folios, corporate billing, travel agent invoices, and guest-vs-company charge separation.",
      },
      {
        question: "Is POS billing included for restaurants?",
        answer:
          "Yes. Our integrated POS handles restaurant, room service, and minibar billing with the same GST compliance as front desk folios.",
      },
    ],
    ctaTitle: "Simplify Your Hotel Tax Compliance",
    ctaSubtitle:
      "Join 12,000+ Indian hotels filing GST effortlessly with HoteloS. Free 120-days trial.",
  },

  "ai-revenue-intelligence": {
    slug: "ai-revenue-intelligence",
    title: "AI Hotel Pricing & Revenue Management Software — HoteloS",
    description:
      "Boost ADR & RevPAR with HoteloS AI revenue intelligence. Dynamic pricing, demand forecasting, competitor tracking & yield automation for Indian hotels.",
    keywords: [
      "AI hotel pricing",
      "hotel revenue intelligence",
      "hotel dynamic pricing AI",
      "hotel yield management software",
      "hotel revenue management system",
      "hotel ADR optimization",
      "hotel RevPAR software",
      "hotel demand forecasting",
      "hotel competitor rate tracking",
      "hotel pricing automation",
      "hotel rate optimization",
      "hotel revenue analytics",
      "hotel profit maximization",
      "hotel pricing strategy software",
      "hotel market intelligence",
      "hotel occupancy optimization",
      "hotel price recommendation AI",
      "HoteloS AI",
      "hotel AI",
      "hotel smart pricing",
      "hotel revenue",
      "hotel pricing",
      "hotel rate",
      "hotel forecast",
      "hotel prediction",
      "hotel analytics",
      "hotel AI app",
      "hotel AI software",
      "hotel smart pricing app",
      "hotel revenue app",
      "hotel pricing app",
      "hotel rate app",
      "hotel forecast app",
      "hotel prediction app",
      "hotel analytics app",
      "hotel AI India",
      "hotel smart pricing India",
      "hotel revenue India",
      "hotel pricing India",
      "hotel rate India",
      "hotel forecast India",
      "hotel prediction India",
      "hotel analytics India",
      "hotel AI price",
      "hotel AI cost",
      "hotel AI demo",
      "hotel AI trial",
      "hotel AI free",
      "hotel revenue price",
      "hotel revenue cost",
      "hotel revenue demo",
      "hotel revenue trial",
      "hotel revenue free",
      "hotel pricing price",
      "hotel pricing cost",
      "hotel pricing demo",
      "hotel pricing trial",
      "hotel pricing free",
      "hotel rate price",
      "hotel rate cost",
      "hotel rate demo",
      "hotel rate trial",
      "hotel rate free",
      "hotel forecast price",
      "hotel forecast cost",
      "hotel forecast demo",
      "hotel forecast trial",
      "hotel forecast free",
      "hotel prediction price",
      "hotel prediction cost",
      "hotel prediction demo",
      "hotel prediction trial",
      "hotel prediction free",
      "hotel analytics price",
      "hotel analytics cost",
      "hotel analytics demo",
      "hotel analytics trial",
      "hotel analytics free",
      "hotel ADR",
      "hotel RevPAR",
      "hotel occupancy",
      "hotel yield",
      "hotel dynamic pricing",
      "hotel automated pricing",
      "hotel AI pricing",
      "hotel machine learning",
      "hotel data analytics",
      "hotel business intelligence",
      "hotel revenue management",
      "hotel revenue optimization",
      "hotel revenue strategy",
      "hotel pricing strategy",
      "hotel pricing optimization",
      "hotel rate optimization",
      "hotel rate strategy",
      "hotel pricing model",
      "hotel pricing algorithm",
      "hotel AI model",
      "hotel AI algorithm",
      "hotel smart system",
      "hotel intelligent system",
      "hotel automated system",
      "hotel digital pricing",
    ],
    canonical: "https://hotelos.online/ai-revenue-intelligence",
    ogTitle: "AI Hotel Pricing & Revenue Management Software — HoteloS",
    ogDescription:
      "AI-powered dynamic pricing, demand forecasting & competitor tracking to boost ADR and RevPAR.",
    heroTitle: "AI Revenue Intelligence for Indian Hotels",
    heroSubtitle:
      "Boost ADR & RevPAR with dynamic pricing, demand forecasting, competitor tracking & automated yield management.",
    problemTitle: "Setting room rates based on gut feeling instead of data?",
    problemPoints: [
      "Same rate all year regardless of demand spikes",
      "No visibility into competitor pricing changes",
      "Missed revenue during high-demand events and festivals",
      "Manual rate updates that take hours and still get it wrong",
    ],
    features: [
      {
        title: "Dynamic Pricing Engine",
        description:
          "Real-time rate adjustments based on occupancy, booking pace, local demand, and competitor positioning.",
      },
      {
        title: "Demand Forecasting",
        description:
          "Predict future occupancy and revenue with machine learning models trained on Indian hotel market patterns.",
      },
      {
        title: "Competitor Rate Tracking",
        description:
          "Automated monitoring of competitor rates across OTAs with instant alerts when market pricing shifts.",
      },
      {
        title: "Yield Automation",
        description:
          "Set rules for length-of-stay pricing, last-minute discounts, early-bird rates, and package bundling.",
      },
      {
        title: "Revenue Analytics Dashboard",
        description:
          "Track ADR, RevPAR, GOPPAR, and booking channel mix with visual trends and actionable insights.",
      },
      {
        title: "Smart Alerts",
        description:
          "Get notified when demand spikes, competitor rates drop, or when your hotel is underpriced for the market.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Connect your data",
        description:
          "HoteloS ingests your booking history, competitor rates, and local events.",
      },
      {
        title: "Get AI recommendations",
        description:
          "Receive optimal rate suggestions updated multiple times per day.",
      },
      {
        title: "Apply with one click",
        description:
          "Accept AI rates or set auto-pilot mode for hands-free revenue optimization.",
      },
    ],
    stats: [
      { label: "Average RevPAR increase", value: "18-24%" },
      { label: "Pricing updates per day", value: "48x" },
      { label: "Competitors tracked", value: "Unlimited" },
      { label: "Forecast accuracy", value: "94%" },
    ],
    faqs: [
      {
        question: "How does HoteloS AI pricing work?",
        answer:
          "HoteloS analyzes historical booking data, local events, competitor rates, seasonality, and demand signals to recommend optimal room rates in real time.",
      },
      {
        question: "Can AI pricing really increase my revenue?",
        answer:
          "Hotels using HoteloS AI revenue intelligence report an average 18-24% increase in RevPAR within the first 90 days.",
      },
      {
        question: "Does it track competitor rates?",
        answer:
          "Yes. HoteloS monitors competitor pricing across Booking.com, MakeMyTrip, and brand websites, alerting you when market rates shift.",
      },
      {
        question: "Can I set pricing rules and boundaries?",
        answer:
          "Absolutely. You define minimum and maximum rates, seasonal baselines, and OTA-specific rules. The AI recommends within your guardrails.",
      },
      {
        question: "Is it suitable for small hotels?",
        answer:
          "Yes. HoteloS AI pricing is designed for hotels of all sizes, from 5-room guest houses to 200-room resorts, with pricing starting at ₹1,500/month.",
      },
    ],
    ctaTitle: "Let AI Maximize Your Hotel Revenue",
    ctaSubtitle:
      "Join 12,000+ hotels using HoteloS AI revenue intelligence. Free 120-days trial.",
  },

  "whatsapp-automation": {
    slug: "whatsapp-automation",
    title: "WhatsApp Hotel Booking & Guest Messaging — HoteloS",
    description:
      "Enable WhatsApp bookings, automated confirmations, pre-arrival messages, checkout reminders & review requests. HoteloS turns WhatsApp into your hotel's best channel.",
    keywords: [
      "WhatsApp hotel booking",
      "hotel WhatsApp automation",
      "hotel guest messaging",
      "hotel chatbot India",
      "hotel WhatsApp API",
      "hotel automated messaging",
      "hotel confirmation WhatsApp",
      "hotel check-in WhatsApp",
      "hotel review request WhatsApp",
      "hotel upselling WhatsApp",
      "hotel guest communication",
      "hotel contactless check-in",
      "hotel digital concierge",
      "hotel messaging platform",
      "hotel notification software",
      "hotel guest engagement",
      "hotel WhatsApp marketing",
      "HoteloS WhatsApp",
      "hotel WhatsApp",
      "hotel chat",
      "hotel message",
      "hotel bot",
      "hotel communication",
      "hotel guest message",
      "hotel booking message",
      "hotel confirmation",
      "hotel reminder",
      "hotel notification",
      "hotel WhatsApp app",
      "hotel WhatsApp software",
      "hotel chat app",
      "hotel chat software",
      "hotel message app",
      "hotel message software",
      "hotel bot app",
      "hotel bot software",
      "hotel communication app",
      "hotel communication software",
      "hotel WhatsApp India",
      "hotel chat India",
      "hotel message India",
      "hotel bot India",
      "hotel communication India",
      "hotel WhatsApp price",
      "hotel WhatsApp cost",
      "hotel WhatsApp demo",
      "hotel WhatsApp trial",
      "hotel WhatsApp free",
      "hotel chat price",
      "hotel chat cost",
      "hotel chat demo",
      "hotel chat trial",
      "hotel chat free",
      "hotel message price",
      "hotel message cost",
      "hotel message demo",
      "hotel message trial",
      "hotel message free",
      "hotel bot price",
      "hotel bot cost",
      "hotel bot demo",
      "hotel bot trial",
      "hotel bot free",
      "hotel communication price",
      "hotel communication cost",
      "hotel communication demo",
      "hotel communication trial",
      "hotel communication free",
      "hotel WhatsApp login",
      "hotel WhatsApp signup",
      "hotel WhatsApp dashboard",
      "hotel WhatsApp panel",
      "hotel WhatsApp portal",
      "hotel WhatsApp tool",
      "hotel WhatsApp solution",
      "hotel WhatsApp platform",
      "hotel WhatsApp company",
      "hotel WhatsApp provider",
      "hotel WhatsApp vendor",
      "hotel WhatsApp API",
      "hotel WhatsApp business",
      "hotel WhatsApp business API",
      "hotel WhatsApp integration",
      "hotel WhatsApp automation",
      "hotel WhatsApp marketing",
      "hotel WhatsApp booking",
      "hotel WhatsApp reservation",
      "hotel WhatsApp checkin",
      "hotel WhatsApp checkout",
      "hotel WhatsApp payment",
      "hotel WhatsApp invoice",
      "hotel WhatsApp receipt",
      "hotel WhatsApp feedback",
      "hotel WhatsApp review",
      "hotel WhatsApp rating",
      "hotel WhatsApp survey",
      "hotel WhatsApp support",
      "hotel WhatsApp help",
      "hotel WhatsApp service",
    ],
    canonical: "https://hotelos.online/whatsapp-automation",
    ogTitle: "WhatsApp Hotel Booking & Guest Messaging — HoteloS",
    ogDescription:
      "WhatsApp bookings, auto-confirmations, pre-arrival messages & review requests. Turn WhatsApp into your #1 guest channel.",
    heroTitle: "Turn WhatsApp Into Your Hotel's Best Channel",
    heroSubtitle:
      "Enable direct bookings, automate guest communication, send pre-arrival messages & collect reviews — all on WhatsApp.",
    problemTitle: "Guests ignore emails but live on WhatsApp?",
    problemPoints: [
      "Email open rates below 20% for booking confirmations",
      "Phone calls interrupting front desk operations",
      "No automated way to request reviews after checkout",
      "Missed upsell opportunities because guests are hard to reach",
    ],
    features: [
      {
        title: "Direct WhatsApp Bookings",
        description:
          "Guests browse rooms, select dates, and complete bookings entirely within WhatsApp with instant confirmation.",
      },
      {
        title: "Automated Guest Journey",
        description:
          "Trigger confirmation, pre-arrival, check-in, checkout, and review request messages automatically based on reservation status.",
      },
      {
        title: "Two-Way Front Desk Chat",
        description:
          "Guests message your team for requests, complaints, or questions. All conversations sync with the guest profile in HoteloS.",
      },
      {
        title: "Digital Check-In Links",
        description:
          "Send pre-arrival registration forms, ID upload links, and room key access via WhatsApp for contactless check-in.",
      },
      {
        title: "Upsell & Review Automation",
        description:
          "Promote room upgrades, late checkout, and spa packages. Auto-request Google reviews 24 hours after departure.",
      },
      {
        title: "Broadcast & Campaigns",
        description:
          "Send festival offers, seasonal packages, and loyalty rewards to past guests with WhatsApp broadcast lists.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Connect WhatsApp Business API",
        description:
          "Verify your business profile and link your WhatsApp number.",
      },
      {
        title: "Set message templates",
        description:
          "Configure booking confirmations, check-in links, and review requests.",
      },
      {
        title: "Automate 24/7",
        description:
          "Guests receive instant responses and updates without front desk intervention.",
      },
    ],
    stats: [
      { label: "WhatsApp open rate", value: "98%" },
      { label: "Response time", value: "Instant" },
      { label: "Review collection", value: "3x more" },
      { label: "Upsell conversions", value: "+22%" },
    ],
    faqs: [
      {
        question: "Can guests book rooms via WhatsApp?",
        answer:
          "Yes. HoteloS enables direct WhatsApp bookings with an embedded booking link, room selection, and instant confirmation messages.",
      },
      {
        question: "Is this an official WhatsApp Business API integration?",
        answer:
          "Yes. HoteloS uses the official WhatsApp Business API with verified business profiles, ensuring reliable message delivery and compliance.",
      },
      {
        question: "What messages can be automated?",
        answer:
          "Booking confirmations, pre-arrival instructions, digital check-in links, checkout reminders, payment requests, review invitations, and upsell offers.",
      },
      {
        question: "Can guests chat with my front desk on WhatsApp?",
        answer:
          "Absolutely. Two-way messaging lets guests ask questions, request services, or report issues directly to your front desk team.",
      },
      {
        question: "Does it work for OTA bookings too?",
        answer:
          "Yes. You can message guests who booked via Booking.com or MakeMyTrip by capturing their WhatsApp numbers at check-in.",
      },
    ],
    ctaTitle: "Start Conversations That Drive Bookings",
    ctaSubtitle:
      "Join 12,000+ hotels using HoteloS WhatsApp automation. Free 120-days trial.",
  },

  "booking-engine": {
    slug: "booking-engine",
    title: "Hotel Booking Engine India | Direct Booking Widget — HoteloS",
    description:
      "Increase direct bookings with HoteloS commission-free booking engine. Embeddable widget, real-time availability, promo codes & UPI/card payments for Indian hotels.",
    keywords: [
      "hotel booking engine India",
      "hotel direct booking software",
      "hotel booking widget",
      "hotel reservation engine",
      "hotel online booking system",
      "hotel commission-free bookings",
      "hotel website booking integration",
      "hotel booking page India",
      "hotel booking form software",
      "hotel payment integration",
      "hotel UPI booking",
      "hotel promo code system",
      "hotel package booking",
      "hotel group booking engine",
      "hotel mobile booking",
      "hotel instant confirmation",
      "hotel booking funnel optimization",
      "HoteloS booking engine",
      "hotel booking",
      "hotel reservation",
      "hotel direct booking",
      "hotel website booking",
      "hotel online booking",
      "hotel web booking",
      "hotel booking app",
      "hotel booking software",
      "hotel reservation app",
      "hotel reservation software",
      "hotel direct booking app",
      "hotel direct booking software",
      "hotel website booking app",
      "hotel website booking software",
      "hotel online booking app",
      "hotel online booking software",
      "hotel web booking app",
      "hotel web booking software",
      "hotel booking India",
      "hotel reservation India",
      "hotel direct booking India",
      "hotel website booking India",
      "hotel online booking India",
      "hotel web booking India",
      "hotel booking price",
      "hotel booking cost",
      "hotel booking demo",
      "hotel booking trial",
      "hotel booking free",
      "hotel reservation price",
      "hotel reservation cost",
      "hotel reservation demo",
      "hotel reservation trial",
      "hotel reservation free",
      "hotel direct booking price",
      "hotel direct booking cost",
      "hotel direct booking demo",
      "hotel direct booking trial",
      "hotel direct booking free",
      "hotel website booking price",
      "hotel website booking cost",
      "hotel website booking demo",
      "hotel website booking trial",
      "hotel website booking free",
      "hotel online booking price",
      "hotel online booking cost",
      "hotel online booking demo",
      "hotel online booking trial",
      "hotel online booking free",
      "hotel web booking price",
      "hotel web booking cost",
      "hotel web booking demo",
      "hotel web booking trial",
      "hotel web booking free",
      "hotel booking login",
      "hotel booking signup",
      "hotel booking dashboard",
      "hotel booking panel",
      "hotel booking portal",
      "hotel booking tool",
      "hotel booking solution",
      "hotel booking platform",
      "hotel booking company",
      "hotel booking provider",
      "hotel booking vendor",
      "hotel booking engine",
      "hotel booking widget",
      "hotel booking plugin",
      "hotel booking form",
      "hotel booking button",
      "hotel booking link",
      "hotel booking URL",
      "hotel booking page",
      "hotel booking site",
      "hotel booking website",
      "hotel booking gateway",
      "hotel booking system",
      "hotel booking service",
    ],
    canonical: "https://hotelos.online/booking-engine",
    ogTitle: "Hotel Booking Engine India | Direct Booking Widget — HoteloS",
    ogDescription:
      "Commission-free direct bookings with embeddable widget, UPI/card payments & promo codes. Reduce OTA dependency.",
    heroTitle: "Commission-Free Hotel Booking Engine",
    heroSubtitle:
      "Increase direct bookings with an embeddable widget, real-time availability, Indian payment methods & promo codes.",
    problemTitle: "Paying 15-25% commission on every OTA booking?",
    problemPoints: [
      "OTA commissions eating into your profit margins",
      "No direct relationship with your guests",
      "Website visitors leaving because there's no booking option",
      "Complex payment setup that small hotels can't afford",
    ],
    features: [
      {
        title: "Embeddable Booking Widget",
        description:
          "One-line embed code for your website, Facebook, Instagram, or Google Business. Matches your brand colors automatically.",
      },
      {
        title: "Real-Time Availability",
        description:
          "Live room inventory synced with your PMS and channel manager. No risk of overbooking from your website.",
      },
      {
        title: "Indian Payment Gateway",
        description:
          "UPI, credit/debit cards, net banking, Paytm, PhonePe, and EMI — with instant confirmation and auto-invoice generation.",
      },
      {
        title: "Promo Code Engine",
        description:
          "Create unlimited discount codes, early-bird pricing, last-minute deals, and corporate rate codes.",
      },
      {
        title: "Mobile-First Design",
        description:
          "70% of Indian travelers book on mobile. Our booking engine is optimized for smartphones with one-tap UPI.",
      },
      {
        title: "Booking Analytics",
        description:
          "Track conversion rates, abandoned bookings, traffic sources, and revenue from direct vs. OTA channels.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Get your embed code",
        description: "Copy one line of code from HoteloS dashboard.",
      },
      {
        title: "Paste on your website",
        description: "Works with WordPress, Wix, custom HTML, or any builder.",
      },
      {
        title: "Start taking direct bookings",
        description:
          "Guests book and pay instantly. Money lands in your account directly.",
      },
    ],
    stats: [
      { label: "Commission on direct bookings", value: "0%" },
      { label: "Payment methods", value: "10+" },
      { label: "Mobile conversion", value: "+35%" },
      { label: "Setup time", value: "5 min" },
    ],
    faqs: [
      {
        question: "What is a hotel booking engine?",
        answer:
          "A booking engine is software that lets guests reserve rooms directly on your hotel's website or social media, bypassing OTA commissions.",
      },
      {
        question: "Does HoteloS charge commission on direct bookings?",
        answer:
          "No. Direct bookings through HoteloS are 100% commission-free. You only pay the flat monthly subscription starting at ₹1,500.",
      },
      {
        question: "Which payment methods are supported?",
        answer:
          "UPI, credit/debit cards, net banking, wallets (Paytm, PhonePe), and EMI options — all with instant payment confirmation.",
      },
      {
        question: "Can I embed it on my existing website?",
        answer:
          "Yes. HoteloS provides a simple embed code that works with WordPress, Wix, custom HTML, or any website builder.",
      },
      {
        question: "Does it support promo codes and packages?",
        answer:
          "Absolutely. Create seasonal discounts, corporate codes, early-bird offers, and bundled packages (room + spa + dinner).",
      },
    ],
    ctaTitle: "Reduce OTA Dependency Today",
    ctaSubtitle:
      "Join 12,000+ hotels driving direct bookings with HoteloS. Free 120-days trial. No setup fees.",
  },

  "small-hotels": {
    slug: "small-hotels",
    title: "Small Hotel Software India | Budget PMS from ₹1,500 — HoteloS",
    description:
      "Affordable hotel management software for small hotels, guest houses & budget properties. Full PMS, channel manager, GST billing & WhatsApp from ₹1,500/month.",
    keywords: [
      "small hotel software India",
      "budget hotel management system",
      "affordable hotel PMS",
      "small hotel PMS India",
      "budget hotel software",
      "small property management system",
      "hotel software for 10 rooms",
      "hotel software for 20 rooms",
      "guest house software India",
      "lodge management software",
      "homestay software India",
      "budget hotel billing software",
      "cheap hotel PMS India",
      "hotel software low price",
      "small hotel booking system",
      "hotel management app India",
      "best PMS for small hotels",
      "HoteloS small hotels",
      "small hotel",
      "budget hotel",
      "cheap hotel",
      "mini hotel",
      "small hotel app",
      "small hotel software",
      "small hotel system",
      "budget hotel app",
      "budget hotel software",
      "budget hotel system",
      "cheap hotel app",
      "cheap hotel software",
      "cheap hotel system",
      "mini hotel app",
      "mini hotel software",
      "mini hotel system",
      "small hotel India",
      "budget hotel India",
      "cheap hotel India",
      "mini hotel India",
      "small hotel price",
      "small hotel cost",
      "small hotel demo",
      "small hotel trial",
      "small hotel free",
      "budget hotel price",
      "budget hotel cost",
      "budget hotel demo",
      "budget hotel trial",
      "budget hotel free",
      "cheap hotel price",
      "cheap hotel cost",
      "cheap hotel demo",
      "cheap hotel trial",
      "cheap hotel free",
      "mini hotel price",
      "mini hotel cost",
      "mini hotel demo",
      "mini hotel trial",
      "mini hotel free",
      "small hotel login",
      "small hotel signup",
      "small hotel dashboard",
      "small hotel panel",
      "small hotel portal",
      "small hotel tool",
      "small hotel solution",
      "small hotel platform",
      "small hotel company",
      "small hotel provider",
      "small hotel vendor",
      "budget hotel login",
      "budget hotel signup",
      "budget hotel dashboard",
      "budget hotel panel",
      "budget hotel portal",
      "budget hotel tool",
      "budget hotel solution",
      "budget hotel platform",
      "budget hotel company",
      "budget hotel provider",
      "budget hotel vendor",
      "cheap hotel login",
      "cheap hotel signup",
      "cheap hotel dashboard",
      "cheap hotel panel",
      "cheap hotel portal",
      "cheap hotel tool",
      "cheap hotel solution",
      "cheap hotel platform",
      "cheap hotel company",
      "cheap hotel provider",
      "cheap hotel vendor",
      "mini hotel login",
      "mini hotel signup",
      "mini hotel dashboard",
      "mini hotel panel",
      "mini hotel portal",
      "mini hotel tool",
      "mini hotel solution",
      "mini hotel platform",
      "mini hotel company",
      "mini hotel provider",
      "mini hotel vendor",
      "small property",
      "small property app",
      "small property software",
      "small property system",
      "small property India",
      "small property price",
      "small property cost",
      "small property demo",
      "small property trial",
      "small property free",
      "small property login",
      "small property signup",
      "small property dashboard",
      "small property panel",
      "small property portal",
      "small property tool",
      "small property solution",
      "small property platform",
      "small property company",
      "small property provider",
      "small property vendor",
      "couple hotel",
      "couple friendly hotel",
      "couple room",
      "couple friendly room",
      "unmarried couple hotel",
      "unmarried couple room",
      "boyfriend girlfriend hotel",
      "bf gf hotel",
      "boyfriend girlfriend room",
      "bf gf room",
      "couple stay",
      "couple allowed",
      "cheap couple hotel",
      "low budget couple hotel",
      "budget couple room",
      "cheap couple room",
      "affordable couple hotel",
      "couple hotel under 500",
      "couple hotel under 1000",
      "couple room 500",
      "couple room 1000",
      "couple hotel offer",
      "couple hotel deal",
      "couple hotel hourly",
      "couple room hourly",
      "couple hotel 3 hours",
      "couple hotel 6 hours",
      "couple hotel 12 hours",
      "couple hotel day use",
      "couple hotel short stay",
      "private couple hotel",
      "safe couple hotel",
      "secure couple hotel",
      "couple hotel no questions",
      "couple hotel no judgement",
      "couple hotel privacy",
      "couple hotel local id",
      "couple hotel local id accepted",
      "couple hotel same city id",
      "couple hotel aadhar accepted",
      "unmarried couple allowed",
      "unmarried couple welcome",
      "unmarried couple accepted",
      "dating couple hotel",
      "young couple hotel",
      "boyfriend hotel",
      "girlfriend hotel",
      "partner hotel",
      "couple hotel near me",
      "couple hotel nearby",
      "couple hotel Nagpur",
      "couple hotel Mumbai",
      "couple hotel Pune",
      "couple hotel Hyderabad",
      "couple hotel Goa",
    ],
    canonical: "https://hotelos.online/small-hotels",
    ogTitle: "Small Hotel Software India | Budget PMS from ₹1,500 — HoteloS",
    ogDescription:
      "Full PMS, channel manager, GST billing & WhatsApp automation for small hotels. Plans from ₹1,500/month.",
    heroTitle: "Hotel Software That Fits Small Budgets",
    heroSubtitle:
      "Full PMS, channel manager, GST billing & WhatsApp automation for small hotels, guest houses & budget properties. From ₹1,500/month.",
    problemTitle:
      "Big hotel software is too expensive and too complex for your property?",
    problemPoints: [
      "Enterprise PMS costs ₹10,000+/month with features you never use",
      "Complex setup requiring IT consultants",
      "No GST support built for Indian small properties",
      "Missing OTA connections because channel managers cost extra",
    ],
    features: [
      {
        title: "All-in-One PMS",
        description:
          "Reservations, front desk, housekeeping, billing, and reporting in one simple dashboard. No multiple subscriptions.",
      },
      {
        title: "Channel Manager Included",
        description:
          "Sync with Booking.com, MakeMyTrip, and Goibibo at no extra cost. Same features big chains pay thousands for.",
      },
      {
        title: "GST Billing Made Simple",
        description:
          "Auto-calculate GST, generate invoices, and file reports without hiring an accountant. Built for Indian tax rules.",
      },
      {
        title: "WhatsApp Guest Communication",
        description:
          "Send confirmations, collect reviews, and answer guest queries on WhatsApp — the app every Indian uses.",
      },
      {
        title: "Mobile-First Design",
        description:
          "Run your entire hotel from your smartphone. Perfect for owner-operators who are always on the move.",
      },
      {
        title: "24/7 Support in Hindi & English",
        description:
          "Get help anytime via phone, WhatsApp, or email. Our India-based team understands small hotel challenges.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Sign up online",
        description:
          "Create your account in 2 minutes. No paperwork or site visits.",
      },
      {
        title: "Add your rooms",
        description:
          "Enter room types, rates, and photos. Our team helps if needed.",
      },
      {
        title: "Go live today",
        description:
          "Start taking bookings from your website and OTAs within hours.",
      },
    ],
    stats: [
      { label: "Small hotels onboarded", value: "5,000+" },
      { label: "Starting price", value: "₹1,500/mo" },
      { label: "Setup time", value: "Under 1 hr" },
      { label: "Support languages", value: "Hindi + English" },
    ],
    faqs: [
      {
        question: "Is HoteloS suitable for small hotels with 5-20 rooms?",
        answer:
          "Absolutely. HoteloS is designed for hotels of all sizes. Our starter plan at ₹1,500/month is perfect for small hotels, guest houses, and homestays.",
      },
      {
        question: "Do I need technical knowledge to use HoteloS?",
        answer:
          "No. HoteloS is built for non-technical hotel owners. Setup takes under 30 minutes and our team provides free training.",
      },
      {
        question: "Can a small hotel afford a channel manager?",
        answer:
          "Yes. HoteloS includes channel manager, booking engine, and PMS in one affordable plan. No separate subscriptions needed.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes. Every small hotel gets a 120-days free trial with full access to all features. No credit card required.",
      },
      {
        question: "Can I upgrade as my hotel grows?",
        answer:
          "Yes. HoteloS scales with you. Upgrade anytime for more rooms, properties, or advanced features like AI pricing.",
      },
    ],
    ctaTitle: "Start Running Your Hotel Like a Pro",
    ctaSubtitle:
      "Join 12,000+ hotels using HoteloS. Free 120-days trial. No credit card. Cancel anytime.",
  },
  "small-hotel": {
    slug: "small-hotels",
    title: "Small Hotel Software India | Budget PMS from ₹1,500 — HoteloS",
    description:
      "Affordable hotel management software for small hotels, guest houses & budget properties. Full PMS, channel manager, GST billing & WhatsApp from ₹1,500/month.",
    keywords: [
      "small hotel software India",
      "budget hotel management system",
      "affordable hotel PMS",
      "small hotel PMS India",
      "budget hotel software",
      "small property management system",
      "hotel software for 10 rooms",
      "hotel software for 20 rooms",
      "guest house software India",
      "lodge management software",
      "homestay software India",
      "budget hotel billing software",
      "cheap hotel PMS India",
      "hotel software low price",
      "small hotel booking system",
      "hotel management app India",
      "best PMS for small hotels",
      "HoteloS small hotels",
      "small hotel",
      "budget hotel",
      "cheap hotel",
      "mini hotel",
      "small hotel app",
      "small hotel software",
      "small hotel system",
      "budget hotel app",
      "budget hotel software",
      "budget hotel system",
      "cheap hotel app",
      "cheap hotel software",
      "cheap hotel system",
      "mini hotel app",
      "mini hotel software",
      "mini hotel system",
      "small hotel India",
      "budget hotel India",
      "cheap hotel India",
      "mini hotel India",
      "small hotel price",
      "small hotel cost",
      "small hotel demo",
      "small hotel trial",
      "small hotel free",
      "budget hotel price",
      "budget hotel cost",
      "budget hotel demo",
      "budget hotel trial",
      "budget hotel free",
      "cheap hotel price",
      "cheap hotel cost",
      "cheap hotel demo",
      "cheap hotel trial",
      "cheap hotel free",
      "mini hotel price",
      "mini hotel cost",
      "mini hotel demo",
      "mini hotel trial",
      "mini hotel free",
      "small hotel login",
      "small hotel signup",
      "small hotel dashboard",
      "small hotel panel",
      "small hotel portal",
      "small hotel tool",
      "small hotel solution",
      "small hotel platform",
      "small hotel company",
      "small hotel provider",
      "small hotel vendor",
      "budget hotel login",
      "budget hotel signup",
      "budget hotel dashboard",
      "budget hotel panel",
      "budget hotel portal",
      "budget hotel tool",
      "budget hotel solution",
      "budget hotel platform",
      "budget hotel company",
      "budget hotel provider",
      "budget hotel vendor",
      "cheap hotel login",
      "cheap hotel signup",
      "cheap hotel dashboard",
      "cheap hotel panel",
      "cheap hotel portal",
      "cheap hotel tool",
      "cheap hotel solution",
      "cheap hotel platform",
      "cheap hotel company",
      "cheap hotel provider",
      "cheap hotel vendor",
      "mini hotel login",
      "mini hotel signup",
      "mini hotel dashboard",
      "mini hotel panel",
      "mini hotel portal",
      "mini hotel tool",
      "mini hotel solution",
      "mini hotel platform",
      "mini hotel company",
      "mini hotel provider",
      "mini hotel vendor",
      "small property",
      "small property app",
      "small property software",
      "small property system",
      "small property India",
      "small property price",
      "small property cost",
      "small property demo",
      "small property trial",
      "small property free",
      "small property login",
      "small property signup",
      "small property dashboard",
      "small property panel",
      "small property portal",
      "small property tool",
      "small property solution",
      "small property platform",
      "small property company",
      "small property provider",
      "small property vendor",
      "couple hotel",
      "couple friendly hotel",
      "couple room",
      "couple friendly room",
      "unmarried couple hotel",
      "unmarried couple room",
      "boyfriend girlfriend hotel",
      "bf gf hotel",
      "boyfriend girlfriend room",
      "bf gf room",
      "couple stay",
      "couple allowed",
      "cheap couple hotel",
      "low budget couple hotel",
      "budget couple room",
      "cheap couple room",
      "affordable couple hotel",
      "couple hotel under 500",
      "couple hotel under 1000",
      "couple room 500",
      "couple room 1000",
      "couple hotel offer",
      "couple hotel deal",
      "couple hotel hourly",
      "couple room hourly",
      "couple hotel 3 hours",
      "couple hotel 6 hours",
      "couple hotel 12 hours",
      "couple hotel day use",
      "couple hotel short stay",
      "private couple hotel",
      "safe couple hotel",
      "secure couple hotel",
      "couple hotel no questions",
      "couple hotel no judgement",
      "couple hotel privacy",
      "couple hotel local id",
      "couple hotel local id accepted",
      "couple hotel same city id",
      "couple hotel aadhar accepted",
      "unmarried couple allowed",
      "unmarried couple welcome",
      "unmarried couple accepted",
      "dating couple hotel",
      "young couple hotel",
      "boyfriend hotel",
      "girlfriend hotel",
      "partner hotel",
      "couple hotel near me",
      "couple hotel nearby",
      "couple hotel Nagpur",
      "couple hotel Mumbai",
      "couple hotel Pune",
      "couple hotel Hyderabad",
      "couple hotel Goa",
    ],
    canonical: "https://hotelos.online/small-hotels",
    ogTitle: "Small Hotel Software India | Budget PMS from ₹1,500 — HoteloS",
    ogDescription:
      "Full PMS, channel manager, GST billing & WhatsApp automation for small hotels. Plans from ₹1,500/month.",
    heroTitle: "Hotel Software That Fits Small Budgets",
    heroSubtitle:
      "Full PMS, channel manager, GST billing & WhatsApp automation for small hotels, guest houses & budget properties. From ₹1,500/month.",
    problemTitle:
      "Big hotel software is too expensive and too complex for your property?",
    problemPoints: [
      "Enterprise PMS costs ₹10,000+/month with features you never use",
      "Complex setup requiring IT consultants",
      "No GST support built for Indian small properties",
      "Missing OTA connections because channel managers cost extra",
    ],
    features: [
      {
        title: "All-in-One PMS",
        description:
          "Reservations, front desk, housekeeping, billing, and reporting in one simple dashboard. No multiple subscriptions.",
      },
      {
        title: "Channel Manager Included",
        description:
          "Sync with Booking.com, MakeMyTrip, and Goibibo at no extra cost. Same features big chains pay thousands for.",
      },
      {
        title: "GST Billing Made Simple",
        description:
          "Auto-calculate GST, generate invoices, and file reports without hiring an accountant. Built for Indian tax rules.",
      },
      {
        title: "WhatsApp Guest Communication",
        description:
          "Send confirmations, collect reviews, and answer guest queries on WhatsApp — the app every Indian uses.",
      },
      {
        title: "Mobile-First Design",
        description:
          "Run your entire hotel from your smartphone. Perfect for owner-operators who are always on the move.",
      },
      {
        title: "24/7 Support in Hindi & English",
        description:
          "Get help anytime via phone, WhatsApp, or email. Our India-based team understands small hotel challenges.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Sign up online",
        description:
          "Create your account in 2 minutes. No paperwork or site visits.",
      },
      {
        title: "Add your rooms",
        description:
          "Enter room types, rates, and photos. Our team helps if needed.",
      },
      {
        title: "Go live today",
        description:
          "Start taking bookings from your website and OTAs within hours.",
      },
    ],
    stats: [
      { label: "Small hotels onboarded", value: "5,000+" },
      { label: "Starting price", value: "₹1,500/mo" },
      { label: "Setup time", value: "Under 1 hr" },
      { label: "Support languages", value: "Hindi + English" },
    ],
    faqs: [
      {
        question: "Is HoteloS suitable for small hotels with 5-20 rooms?",
        answer:
          "Absolutely. HoteloS is designed for hotels of all sizes. Our starter plan at ₹1,500/month is perfect for small hotels, guest houses, and homestays.",
      },
      {
        question: "Do I need technical knowledge to use HoteloS?",
        answer:
          "No. HoteloS is built for non-technical hotel owners. Setup takes under 30 minutes and our team provides free training.",
      },
      {
        question: "Can a small hotel afford a channel manager?",
        answer:
          "Yes. HoteloS includes channel manager, booking engine, and PMS in one affordable plan. No separate subscriptions needed.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes. Every small hotel gets a 120-days free trial with full access to all features. No credit card required.",
      },
      {
        question: "Can I upgrade as my hotel grows?",
        answer:
          "Yes. HoteloS scales with you. Upgrade anytime for more rooms, properties, or advanced features like AI pricing.",
      },
    ],
    ctaTitle: "Start Running Your Hotel Like a Pro",
    ctaSubtitle:
      "Join 12,000+ hotels using HoteloS. Free 120-days trial. No credit card. Cancel anytime.",
  },
  resorts: {
    slug: "resorts",
    title: "Resort Management Software India | Spa, F&B & Activities — HoteloS",
    description:
      "All-in-one resort management software with villa tracking, spa scheduling, F&B POS, activity booking & multi-location inventory. Built for Indian resorts.",
    keywords: [
      "resort management software India",
      "resort PMS India",
      "villa management software",
      "spa management software",
      "resort booking system",
      "resort channel manager",
      "resort billing software",
      "resort POS system",
      "resort inventory management",
      "resort activity booking",
      "resort housekeeping software",
      "beach resort software India",
      "hill resort management",
      "wedding venue software India",
      "resort revenue management",
      "multi-villa management system",
      "resort guest experience platform",
      "HoteloS resort",
      "resort software",
      "resort app",
      "resort system",
      "resort PMS",
      "resort management",
      "resort billing",
      "resort booking",
      "resort reservation",
      "resort checkin",
      "resort checkout",
      "resort software India",
      "resort app India",
      "resort system India",
      "resort PMS India",
      "resort management India",
      "resort billing India",
      "resort booking India",
      "resort reservation India",
      "resort software price",
      "resort software cost",
      "resort software demo",
      "resort software trial",
      "resort software free",
      "resort PMS price",
      "resort PMS cost",
      "resort PMS demo",
      "resort PMS trial",
      "resort PMS free",
      "resort booking price",
      "resort booking cost",
      "resort booking demo",
      "resort booking trial",
      "resort booking free",
      "resort software login",
      "resort software signup",
      "resort software dashboard",
      "resort software panel",
      "resort software portal",
      "resort software tool",
      "resort software solution",
      "resort software platform",
      "resort software company",
      "resort software provider",
      "resort software vendor",
    ],
    canonical: "https://hotelos.online/resorts",
    ogTitle:
      "Resort Management Software India | Spa, F&B & Activities — HoteloS",
    ogDescription:
      "Villa tracking, spa scheduling, F&B POS & activity booking. Resort management built for Indian hospitality.",
    heroTitle: "Resort Management Software Built for India",
    heroSubtitle:
      "Manage villas, spas, restaurants, activities & events from one platform. Designed for beach resorts, hill stations & destination properties.",
    problemTitle:
      "Running a resort with separate systems for rooms, spa, restaurant, and activities?",
    problemPoints: [
      "Guest bookings scattered across villa, spa, and restaurant diaries",
      "No unified guest profile across all resort touchpoints",
      "Manual reconciliation between F&B outlets and room folios",
      "Missed revenue from unsold spa slots and activity capacity",
    ],
    features: [
      {
        title: "Villa & Cottage Tracking",
        description:
          "Manage mixed accommodation types with unique attributes, private pools, garden views, and personalized housekeeping.",
      },
      {
        title: "Spa & Wellness Scheduling",
        description:
          "Book treatments, assign therapists, manage inventory, and let guests reserve spa slots from their phones.",
      },
      {
        title: "Multi-Outlet F&B POS",
        description:
          "Run main restaurants, pool bars, in-villa dining, and banquets with centralized kitchen order management.",
      },
      {
        title: "Activity & Excursion Booking",
        description:
          "Let guests book trekking, water sports, yoga, and local tours. Track capacity, schedules, and vendor settlements.",
      },
      {
        title: "Event & Wedding Management",
        description:
          "Manage banquet bookings, event packages, catering menus, and group room blocks for weddings and corporate offsites.",
      },
      {
        title: "Resort-Wide Analytics",
        description:
          "Track revenue per villa, spa utilization, F&B margins, and activity popularity to optimize your resort operations.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Map your resort",
        description:
          "Configure villas, spa rooms, restaurants, and activity centers.",
      },
      {
        title: "Connect all outlets",
        description:
          "Link F&B, spa, and activity bookings to guest folios automatically.",
      },
      {
        title: "Optimize revenue",
        description:
          "Use analytics to fill spa gaps, promote activities, and upsell villa upgrades.",
      },
    ],
    stats: [
      { label: "Resorts using HoteloS", value: "500+" },
      { label: "Outlets managed", value: "3,000+" },
      { label: "Spa bookings/month", value: "45,000+" },
      { label: "Activity revenue uplift", value: "+30%" },
    ],
    faqs: [
      {
        question:
          "Can HoteloS manage villas and cottages separately from hotel rooms?",
        answer:
          "Yes. HoteloS supports mixed inventory types — rooms, villas, cottages, suites, and tents — each with unique rates, amenities, and housekeeping schedules.",
      },
      {
        question: "Does it handle spa and activity bookings?",
        answer:
          "Absolutely. Guests can book spa treatments, yoga sessions, water sports, and excursions through the same system as room reservations.",
      },
      {
        question: "Can I manage multiple restaurants and bars?",
        answer:
          "Yes. HoteloS POS supports unlimited outlets — main restaurant, pool bar, in-villa dining, and room service — all linked to guest folios.",
      },
      {
        question: "Is it suitable for wedding venues and event resorts?",
        answer:
          "Yes. Manage banquet halls, event packages, catering menus, and group bookings with dedicated event management tools.",
      },
      {
        question: "Can guests check in from remote locations?",
        answer:
          "Yes. Digital check-in, WhatsApp communication, and mobile key access are perfect for sprawling resort properties.",
      },
    ],
    ctaTitle: "Elevate Your Resort Operations",
    ctaSubtitle:
      "Join 500+ Indian resorts using HoteloS. Free 120-days trial. No setup fees.",
  },

  "guest-houses": {
    slug: "guest-houses",
    title: "Guest House & Lodge Management Software India — HoteloS",
    description:
      "Simple, affordable software for guest houses, lodges, dharamshalas & service apartments. PMS, GST billing, channel manager & WhatsApp from ₹1,500/month.",
    keywords: [
      "guest house management software India",
      "lodge management software",
      "dharamshala management software",
      "service apartment software India",
      "guest house booking system",
      "lodge billing software",
      "guest house PMS",
      "budget guest house software",
      "small lodge software India",
      "guest house GST software",
      "homestay management software",
      "B&B software India",
      "paying guest management software",
      "hostel management software India",
      "guest house channel manager",
      "guest house invoice software",
      "guest house operations software",
      "HoteloS guest house",
      "guest house software",
      "guest house app",
      "guest house system",
      "guest house PMS",
      "guest house management",
      "guest house billing",
      "guest house booking",
      "guest house reservation",
      "guest house checkin",
      "guest house checkout",
      "guest house software India",
      "guest house app India",
      "guest house system India",
      "guest house PMS India",
      "guest house management India",
      "guest house billing India",
      "guest house booking India",
      "guest house reservation India",
      "guest house software price",
      "guest house software cost",
      "guest house software demo",
      "guest house software trial",
      "guest house software free",
      "guest house PMS price",
      "guest house PMS cost",
      "guest house PMS demo",
      "guest house PMS trial",
      "guest house PMS free",
      "guest house booking price",
      "guest house booking cost",
      "guest house booking demo",
      "guest house booking trial",
      "guest house booking free",
      "guest house software login",
      "guest house software signup",
      "guest house software dashboard",
      "guest house software panel",
      "guest house software portal",
      "guest house software tool",
      "guest house software solution",
      "guest house software platform",
      "guest house software company",
      "guest house software provider",
      "guest house software vendor",
    ],
    canonical: "https://hotelos.online/guest-houses",
    ogTitle: "Guest House & Lodge Management Software India — HoteloS",
    ogDescription:
      "PMS, GST billing, channel manager & WhatsApp for guest houses, lodges & service apartments. From ₹1,500/month.",
    heroTitle: "Software Built for Guest Houses & Lodges",
    heroSubtitle:
      "Simple, affordable PMS with GST billing, OTA connectivity & WhatsApp for guest houses, lodges, dharamshalas & service apartments.",
    problemTitle:
      "Running your guest house with diary books and WhatsApp notes?",
    problemPoints: [
      "No organized way to track monthly vs. daily guest billing",
      "Missing GST invoices for corporate and long-stay guests",
      "No online presence on Booking.com or MakeMyTrip",
      "Guest communication scattered across calls and random WhatsApp chats",
    ],
    features: [
      {
        title: "Simple Room Diary",
        description:
          "Visual calendar showing all bookings at a glance. Color-coded by status: confirmed, checked-in, checkout today, or pending payment.",
      },
      {
        title: "GST Auto-Billing",
        description:
          "Generate GST invoices without understanding tax rules. Auto-applies correct rates for accommodation and food services.",
      },
      {
        title: "OTA Connectivity",
        description:
          "List on Booking.com, MakeMyTrip, and Goibibo without overbooking. Sync rates and availability automatically.",
      },
      {
        title: "WhatsApp Communication",
        description:
          "Send booking confirmations, directions, and payment reminders on WhatsApp. Guests love the personal touch.",
      },
      {
        title: "Long-Stay Management",
        description:
          "Handle monthly rentals, PG accommodations, and corporate guest houses with recurring billing and agreement tracking.",
      },
      {
        title: "Owner Dashboard",
        description:
          "Track daily revenue, occupancy, and pending payments from your phone. Perfect for owner-operated guest houses.",
      },
    ],
    howItWorksSteps: [
      {
        title: "Create your property",
        description: "Add room types, rates, and photos in under 10 minutes.",
      },
      {
        title: "Connect OTAs",
        description:
          "Start receiving online bookings from Booking.com and MakeMyTrip automatically.",
      },
      {
        title: "Manage from your phone",
        description:
          "Check bookings, send invoices, and message guests from anywhere.",
      },
    ],
    stats: [
      { label: "Guest houses onboarded", value: "3,000+" },
      { label: "Starting price", value: "₹1,500/mo" },
      { label: "Average setup", value: "20 min" },
      { label: "Support", value: "24/7" },
    ],
    faqs: [
      {
        question:
          "Is HoteloS suitable for a small guest house with 5-10 rooms?",
        answer:
          "Yes. HoteloS is perfect for guest houses, lodges, and homestays. Our simple interface and affordable pricing make it ideal for small properties.",
      },
      {
        question: "Can I manage monthly and daily guests together?",
        answer:
          "Absolutely. HoteloS handles both transient daily bookings and long-stay monthly guests with different billing cycles and GST rules.",
      },
      {
        question: "Does it work for service apartments and PG accommodations?",
        answer:
          "Yes. Service apartments, PGs, and corporate guest houses can track individual units, tenant agreements, and recurring invoices.",
      },
      {
        question: "Is GST billing included for small guest houses?",
        answer:
          "Yes. Even small guest houses get full GST auto-calculation, invoice generation, and GSTR report support at no extra cost.",
      },
      {
        question: "Can I connect my guest house to Booking.com and MakeMyTrip?",
        answer:
          "Yes. Our channel manager connects guest houses to all major OTAs, helping small properties reach guests they couldn't access before.",
      },
    ],
    ctaTitle: "Run Your Guest House the Smart Way",
    ctaSubtitle:
      "Join 12,000+ properties using HoteloS. Free 120-days trial. No credit card required.",
  },
};

export const landingSlugs = Object.keys(landingPages);
