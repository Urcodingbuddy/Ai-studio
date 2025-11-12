import type { Metadata } from "next";
import { Paytone_One, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
const paytoneOne = Paytone_One({
  subsets: ["latin"],
  weight: "400"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: "500"
});

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Food image specialist powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.className} antialiased`}
      >
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}
