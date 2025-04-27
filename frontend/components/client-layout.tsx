"use client"

import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import NoSSR from "./no-ssr"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // Use NoSSR to prevent hydration mismatch errors
  return (
    <NoSSR>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem={false} 
        disableTransitionOnChange
        forcedTheme="light" // Force light theme to avoid dark mode hydration issues
      >
        {children}
      </ThemeProvider>
    </NoSSR>
  )
}
