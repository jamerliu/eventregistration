import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Event Registration",
  description: "Sign up for school events — winners chosen by fair random draw.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body">
        <Nav />
        <main className="relative z-[1] max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-16">{children}</main>
      </body>
    </html>
  );
}
