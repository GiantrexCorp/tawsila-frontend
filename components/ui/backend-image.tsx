"use client";

import Image, { ImageProps } from "next/image";

/**
 * Image component for backend-hosted images.
 * Uses unoptimized mode to bypass Vercel's image optimization caching issues.
 */
export function BackendImage(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
