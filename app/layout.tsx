import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goods Sorting Game",
  description: "A fun goods sorting puzzle game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
