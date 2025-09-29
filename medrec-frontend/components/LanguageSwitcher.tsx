"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      <Languages className="w-4 h-4 text-gray-500" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
        className="bg-transparent border-0 text-sm text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

