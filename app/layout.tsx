import type { Metadata } from "next";
import { Cormorant, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
	variable: "--font-cormorant",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
	title: "Creator Store",
	description: "Powered by Crevio",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={`${cormorant.variable} ${dmSans.variable} antialiased`}>
				{children}
			</body>
		</html>
	);
}
