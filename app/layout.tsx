import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClubSphere",
  description: "ClubSphere Next.js Boilerplate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: "var(--background)",
          colorForeground: "var(--foreground)",
          colorInput: "var(--input)",
          colorInputForeground: "var(--foreground)",
          colorMutedForeground: "var(--muted-foreground)",
          colorPrimary: "var(--primary)",
          colorDanger: "var(--destructive)",
          colorRing: "var(--ring)",
          colorBorder: "var(--border)",
          borderRadius: "var(--radius)",
        },
      }}
    >
      <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
        <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
