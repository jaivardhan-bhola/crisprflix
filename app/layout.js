import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGateway from "../components/AuthGateway";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CrisprFlix",
  description: "Your ultimate movie database",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthGateway>
          {children}
        </AuthGateway>
      </body>
    </html>
  );
}
