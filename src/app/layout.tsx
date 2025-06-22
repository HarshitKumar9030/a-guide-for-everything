import type { Metadata } from "next";
import { Inter , Just_Another_Hand, Comic_Neue } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import NavBar from "@/components/core/NavBar";

const justAnotherHand = Just_Another_Hand({
  variable: "--font-just-another-hand",
  subsets: ["latin"],
  weight: ['400'],
  style: 'normal',
});


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  style: 'normal',
});

const comic = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ['400', '700', '300'],
  style: 'normal',
});

export const metadata: Metadata = {
  title: {
    default: "Agfe",
    template: "%s | AGFE"
  },
  description: "Get comprehensive, AI-powered guides for any topic. AGFE creates detailed, personalized guides using advanced AI models to help you learn and understand anything.",
  keywords: [
    "AI guides",
    "comprehensive guides", 
    "learning platform",
    "AI-powered education",
    "tutorial generator",
    "knowledge base",
    "learning assistant",
    "educational content",
    "AI tutor",
    "guide generator"
  ],
  authors: [{ name: "Harshit" }],
  creator: "AGFE",
  publisher: "AGFE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://agfe.tech",
    siteName: "AGFE - A Guide for Everything",
    title: "AGFE - A Guide for Everything",
    description: "Get comprehensive, AI-powered guides for any topic. Create detailed, personalized guides using advanced AI models.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "AGFE - A Guide for Everything",
        type: "image/png+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AGFE - A Guide for Everything",
    description: "Get comprehensive, AI-powered guides for any topic. Create detailed, personalized guides using advanced AI models.",
    images: ["/logo.png"],
    creator: "@OhHarshit",
    site: "@OhHarshit",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://agfe.tech"),
  alternates: {
    canonical: "/",
  },
  category: "education",
  classification: "Education, AI, Learning Platform",
  referrer: "origin-when-cross-origin",
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1BE1FF" },
    { media: "(prefers-color-scheme: dark)", color: "#1BE1FF" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AGFE" />
        <meta name="application-name" content="AGFE" />
        <meta name="msapplication-TileColor" content="#1BE1FF" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link rel="dns-prefetch" href="https://vercel.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Agfe",
              "description": "Get comprehensive, AI-powered guides for any topic. Create detailed, personalized guides using advanced AI models.",
              "url": "https://agfe.tech",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Any",
              "permissions": "browser",
              "author": {
                "@type": "Organization",
                "name": "Harshit"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Harshit"
              },
              "inLanguage": "en-US"
            })
          }}
        />
      </head>
      <body
        className={`${comic.variable} ${inter.variable} ${justAnotherHand.variable} ${comic.className} antialiased`}
      >
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
