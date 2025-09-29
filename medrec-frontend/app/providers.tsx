"use client";

import React from "react";
import { TranslationProvider } from "@/hooks/useTranslation";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TranslationProvider>
      {/* 这里可以添加其他Provider，如Context、状态管理等 */}
      {children}
    </TranslationProvider>
  );
}
