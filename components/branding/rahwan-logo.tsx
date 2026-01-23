"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface RahwanLogoProps {
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { width: 120, height: 40 },
  md: { width: 150, height: 50 },
  lg: { width: 180, height: 60 },
};

export function RahwanLogo({ iconOnly = false, size = "md", className = "" }: RahwanLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { width, height } = sizeConfig[size];

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/rahwan-logo-dark.png"
    : "/rahwan-logo-light.png";

  if (iconOnly) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center ${className}`}>
        <Image
          src="/rahwan-favicon.png"
          alt="Rahwan"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={logoSrc}
        alt="Rahwan - For Delivery"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Keep backward compatibility with old name
export { RahwanLogo as TawsilaLogo };
