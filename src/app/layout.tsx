import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { interDisplay, interVariable } from "./fonts";

export const metadata: Metadata = {
  title: "College Planner",
  description: "Track your exams, assignments, and study sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark h-full ${interVariable.variable} ${interDisplay.variable}`}
    >
      <body className="h-full bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}