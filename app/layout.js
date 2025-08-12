import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import AuthContext from "@/lib/AuthContext";
import MaintenanceBanner from "@/components/MaintenanceBanner";

export const metadata = {
  title: "BusinessFlow",
  description: "Manage your business operations efficiently",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <MaintenanceBanner />
        <AuthContext>
          <main className="flex-grow">{children}</main>
        </AuthContext>
        <ToastContainer
          autoClose={2000}
          theme="colored"
          position="top-center"
        />
      </body>
    </html>
  );
}
