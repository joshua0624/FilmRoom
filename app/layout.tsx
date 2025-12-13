import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export const metadata: Metadata = {
  title: "FilmRoom - Ultimate Frisbee Film Review",
  description: "Review and analyze Ultimate Frisbee game footage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <SessionProvider>{children}</SessionProvider>
          <Toaster position="top-right" />
        </ErrorBoundary>
      </body>
    </html>
  );
}

