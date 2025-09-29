import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical theme colors
        medical: {
          primary: '#0F766E',      // 医疗绿主色
          secondary: '#0891B2',    // 医疗蓝辅助色
          accent: '#7C2D12',       // 医疗红强调色
          light: '#F0F9FF',        // 浅蓝背景
          dark: '#083344',         // 深色
        },
        // 状态颜色
        status: {
          normal: '#10B981',       // 正常
          warning: '#F59E0B',      // 警告
          critical: '#EF4444',     // 危急
          info: '#3B82F6',         // 信息
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        medical: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'medical': '0 4px 14px 0 rgba(15, 118, 110, 0.1)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
