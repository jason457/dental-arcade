import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Dental Arcade", template: "%s · Dental Arcade" },
  description: "Practice like a student. Think like a specialist. Interactive dental clinical simulations.",
};
export const viewport: Viewport = { themeColor: "#0a2a2e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto flex min-h-screen max-w-[560px] flex-col px-4">
          <SiteHeader />
          <main className="flex-1 py-4">{children}</main>
          <footer className="py-6 text-xs text-mute">
            Educational simulation with synthetic patients. Supervisors and specialists are fictional characters.
            Nothing here is clinical guidance.
          </footer>
        </div>
      </body>
    </html>
  );
}
