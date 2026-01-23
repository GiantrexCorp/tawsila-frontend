import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rahwan - Smart Inventory & Delivery Management",
  description: "Streamline your inventory and delivery operations with Rahwan's intelligent management system",
  icons: {
    icon: [
      { url: "/rahwan-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/rahwan-favicon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/rahwan-favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

