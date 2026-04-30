import { Inter } from "next/font/google";
import "./globals.css";
import ToasterClient from "@/components/ToasterClient";
import MotionProvider from "@/components/motion/MotionProvider";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Edukai Dashboard",
  description: "Edukai Dashboard",
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${inter.className} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <QueryProvider>
          <MotionProvider>{children}</MotionProvider>
        </QueryProvider>
        <ToasterClient />
      </body>
    </html>
  );
}
