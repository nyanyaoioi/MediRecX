import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "MediRecX - 医疗记录管理系统",
  description: "基于FHEVM的完全加密医疗记录管理系统，确保患者隐私安全",
  keywords: ["医疗记录", "FHEVM", "区块链", "隐私保护", "加密", "医疗管理"],
  authors: [{ name: "MediRecX Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased min-h-screen bg-gray-50">
        <Providers>
          <div className="flex flex-col min-h-screen">
            {/* 主要内容区域（导航栏由各页面自己管理） */}
            <main className="flex-1">
              {children}
            </main>

            {/* 应用底部 */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-600">
                      © 2024 MediRecX. 基于FHEVM技术构建的医疗记录管理系统
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      保护患者隐私，确保数据安全
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-medical-primary rounded-full"></div>
                      <span>完全加密存储</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-medical-secondary rounded-full"></div>
                      <span>权限控制</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-medical-accent rounded-full"></div>
                      <span>区块链验证</span>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
