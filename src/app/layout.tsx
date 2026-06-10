import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoTrace — Carbon Footprint Awareness Platform",
  description:
    "Understand, track, and reduce your carbon footprint with personalised, AI-powered insights. Built for PromptWars: Virtual Challenge 3.",
  keywords: [
    "carbon footprint",
    "climate awareness",
    "sustainability",
    "CO2 calculator",
  ],
  openGraph: {
    title: "EcoTrace — Carbon Footprint Awareness Platform",
    description:
      "Understand, track, and reduce your carbon footprint with personalised, AI-powered insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
