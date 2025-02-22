import { ToastContainer } from "react-toastify";
import "./globals.css";
import AuthContext from "@/lib/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthContext>{children}</AuthContext>
        <ToastContainer
          autoClose={2000}
          theme="colored"
          position="top-center"
        />
      </body>
    </html>
  );
}
