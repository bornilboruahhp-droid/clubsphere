import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClubSphere",
  description: "Campus Club & Organization Management Platform",
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
          colorBackground: "var(--bg-surface)",
          colorForeground: "var(--text-primary)",
          colorInputBackground: "var(--bg-surface)",
          colorInputText: "var(--text-primary)",
          colorMutedForeground: "var(--text-muted)",
          colorPrimary: "var(--accent-primary)",
          colorDanger: "var(--state-error)",
          colorRing: "var(--accent-primary)",
          colorNeutral: "var(--text-primary)",
          colorBorder: "var(--border-default)",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          cardBox: "shadow-none border border-surface-border rounded-2xl bg-surface",
          card: "bg-surface shadow-none",
          headerTitle: "text-copy-primary font-semibold",
          headerSubtitle: "text-copy-secondary",
          socialButtonsBlockButton: "border-surface-border text-copy-primary hover:bg-subtle",
          formButtonPrimary: "bg-brand text-brand-foreground hover:opacity-90",
          footerActionLink: "text-brand hover:opacity-80",
        },
      }}
    >
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body
          className="min-h-full flex flex-col bg-base text-copy-primary font-sans antialiased"
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
