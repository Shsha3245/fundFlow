import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "FundFlow | Merkeziyetsiz & Şeffaf Destek Platformu",
  description:
    "Eğitim, dayanışma, sivil toplum ve bireysel projeler için şeffaf fonlama platformu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          richColors
          closeButton
          position="bottom-center"
          mobileOffset={{ bottom: "20px" }}
          toastOptions={{
            className: "fundflow-toast",
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
