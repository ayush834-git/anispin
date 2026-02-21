import type { Metadata } from "next";
import { SmoothScrollProvider } from "@/components/scroll/smooth-scroll-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AniSpin | Anime Decision Engine",
  description:
    "AniSpin is a high-energy anime decision engine. Stop doom-scrolling and let the wheel lock your next watch.",
  openGraph: {
    title: "AniSpin | Anime Decision Engine",
    description:
      "High-energy anime discovery built to end decision fatigue and launch your next series instantly.",
    siteName: "AniSpin",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
