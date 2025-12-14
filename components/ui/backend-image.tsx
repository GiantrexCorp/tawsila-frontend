"use client";

import Image, { ImageProps } from "next/image";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/**
 * Get the full URL for a backend-hosted image
 */
export function getBackendImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BACKEND_URL}/${cleanPath}`;
}

/**
 * Image component for backend-hosted images.
 * Uses unoptimized mode to bypass Vercel's image optimization caching issues.
 */
export function BackendImage(props: ImageProps) {
  return <Image {...props} unoptimized alt={props.alt || ''} />;
}
