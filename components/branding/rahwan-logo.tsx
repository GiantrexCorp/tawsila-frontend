"use client";

import * as React from "react";
import Image from "next/image";

interface RahwanLogoProps {
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { width: 100, height: 34 },
  md: { width: 130, height: 44 },
  lg: { width: 160, height: 54 },
};

export function RahwanLogo({ iconOnly = false, size = "md", className = "" }: RahwanLogoProps) {
  const { width, height } = sizeConfig[size];

  if (iconOnly) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center ${className}`}>
        <Image
          src="/rahwan-logo.png"
          alt="Rahwan"
          width={40}
          height={40}
          className="rounded-lg object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/rahwan-logo.png"
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
