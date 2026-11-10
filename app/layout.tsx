import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digi Library",
  description: "Search the hostel library and see which books are available.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="flex-1">{children}</div>

        {/* Footer */}
        <footer className="border-t border-border py-6 mt-12">
          <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
            <p>© 2026 Digi Library — Hostel Library Management</p>
            <p>Built with ❤️ for readers</p>
          </div>
        </footer>
      </body>
    </html>
  );
}