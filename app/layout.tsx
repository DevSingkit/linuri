import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINURI",
  description: "Literacy and Numeracy Readiness Indicator — Grade 6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}