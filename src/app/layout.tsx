import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFCFB" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "HoteloS — India's Smartest Hotel Management Software",
    template: "%s",
  },
  description:
    "Manage your hotel with AI revenue intelligence, WhatsApp automation, channel manager & GST filing. Trusted by 12,000+ hotels across India.",
  metadataBase: new URL("https://hotelos.online"),
  keywords: [
    "hotel management software India",
    "hotel PMS India",
    "channel manager India",
    "GST hotel software",
    "hotel management system",
    "HoteloS",
    "cloud hotel PMS",
    "hotel booking engine",
    "hotel revenue management",
    "WhatsApp hotel automation",
  ],
  authors: [{ name: "HoteloS", url: "https://hotelos.online" }],
  creator: "HoteloS",
  publisher: "HoteloS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "HoteloS — India's Smartest Hotel Management Software",
    description:
      "AI revenue intelligence, WhatsApp automation, channel manager & GST filing.",
    url: "https://hotelos.online",
    siteName: "HoteloS",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://hotelos.online/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HoteloS Hotel Management Software Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HoteloS — India's Smartest Hotel Management Software",
    description:
      "AI revenue intelligence, WhatsApp automation, channel manager & GST filing.",
    images: ["https://hotelos.online/twitter-image.jpg"],
    creator: "@HoteloS",
    site: "@HoteloS",
  },
  alternates: {
    canonical: "https://hotelos.online",
    languages: {
      "en-IN": "https://hotelos.online",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",
    yandex: "YOUR_YANDEX_VERIFICATION_CODE",
    yahoo: "YOUR_YAHOO_VERIFICATION_CODE",
    other: {
      me: ["contact@hotelos.online"],
    },
  },
  category: "business",
  classification: "Software",
  referrer: "origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className="bg-[#FDFCFB]"
    >
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "HoteloS",
              url: "https://hotelos.online",
              logo: "https://hotelos.online/logo.png",
              sameAs: [
                "https://twitter.com/HoteloS",
                "https://linkedin.com/company/hotelos",
                "https://facebook.com/HoteloS",
                "https://instagram.com/HoteloS",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91-XXXXXXXXXX",
                contactType: "customer service",
                areaServed: "IN",
                availableLanguage: ["English", "Hindi"],
              },
            }),
          }}
        />

        {/* SoftwareApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "HoteloS",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "India's smartest hotel management platform with AI revenue intelligence, WhatsApp automation, channel manager and GST billing.",
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
              featureList:
                "AI Revenue Intelligence, WhatsApp Automation, OTA Channel Manager, GST Billing, Booking Engine, Front Desk PMS, Housekeeping Module, POS Integration",
              softwareVersion: "2026",
              applicationSubCategory: "Hotel Management Software",
              countriesSupported: "IN",
              availableLanguage: "English",
            }),
          }}
        />

        {/* WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "HoteloS",
              url: "https://hotelos.online",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://hotelos.online/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* LocalBusiness Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "HoteloS",
              image: "https://hotelos.online/logo.png",
              url: "https://hotelos.online",
              telephone: "+91-XXXXXXXXXX",
              priceRange: "₹₹",
              address: {
                "@type": "PostalAddress",
                addressCountry: "IN",
                addressRegion: "Maharashtra",
                addressLocality: "Nagpur",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "21.1458",
                longitude: "79.0882",
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "00:00",
                closes: "23:59",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${inter.className} font-sans antialiased bg-[#FDFCFB] text-gray-900`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}