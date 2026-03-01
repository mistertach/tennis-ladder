import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Tennis League",
    description: "Manage your tennis league, matches, and rankings.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <Navbar />
                    <main style={{ minHeight: 'calc(100vh - 70px)' }}>
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
