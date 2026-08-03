import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./Sidebar";
import { ThemeProvider } from "./ThemeProvider";
import ThemeToggleButton from "./ThemeToggleButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Prediksi Drop-Out Siswa",
  description: "Web-Based Student Drop-Out Risk Prediction Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors duration-300`}>
        <ThemeProvider>
          <Sidebar />
          <ThemeToggleButton />
          <main className="flex-1 w-full overflow-y-auto">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
