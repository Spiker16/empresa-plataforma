import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
} from "@/lib/site";
import { serializeJsonLd } from "@/lib/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "bicicletas eléctricas Colombia",
    "bicicletas eléctricas Bogotá",
    "movilidad sostenible",
    "bicicletas urbanas eléctricas",
    "Bikefast Electrics",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description:
      "Bicicletas eléctricas para moverte con libertad, energía y propósito.",
    images: [
      {
        url: "/og-image.jpg", // TODO: sube una imagen 1200x630 a /public
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description:
      "Compra bicicletas eléctricas y encuentra el modelo ideal para tu ritmo.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Bicicletas eléctricas para moverte con libertad, energía y propósito.",
  areaServed: "CO",
  sameAs: [
    // TODO: agrega tus redes sociales reales
    // "https://www.instagram.com/tuempresa",
    // "https://www.facebook.com/tuempresa",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}