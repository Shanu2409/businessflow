import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthContext from "@/lib/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthContext>{children}</AuthContext>
      </body>
    </html>
  );
}
