import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "HoteloS — India's Smartest Hotel Management Software",
    template: "%s | HoteloS",
  },

  description:
    "Manage your hotel with AI revenue intelligence, WhatsApp automation, channel manager & GST filing.",

  metadataBase: new URL("https://hotelos.online"),

  keywords: [
    "hotel management software India",
    "hotel PMS India",
    "channel manager India",
    "GST hotel software",
    "hotel management system",
    "HoteloS",
  ],

  openGraph: {
    title:
      "HoteloS — India's Smartest Hotel Management Software",

    description:
      "AI revenue intelligence, WhatsApp automation, channel manager & GST filing.",

    url: "https://hotelos.online",

    siteName: "HoteloS",

    locale: "en_IN",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "HoteloS — India's Smartest Hotel Management Software",

    description:
      "AI revenue intelligence, WhatsApp automation, channel manager & GST filing.",
  },

  alternates: {
    canonical: "https://hotelos.online",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-[#FDFCFB]"
    >
      <head>
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
                "India's smartest hotel management platform with AI revenue intelligence, WhatsApp automation, channel manager and GST filing.",

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
      </head>

      <body
        className={`${inter.variable} ${inter.className} font-sans antialiased bg-gray-50 text-gray-900`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}