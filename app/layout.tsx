import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tawsila - Smart Inventory & Delivery Management",
  description: "Streamline your inventory and delivery operations with Tawsila's intelligent management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

