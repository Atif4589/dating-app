import type { Metadata } from "next";
import { Rozha_One, Poppins } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

const rozhaOne = Rozha_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "shaadikrlo.com",
  description: "Just get married already.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${rozhaOne.variable} ${poppins.variable}`}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}