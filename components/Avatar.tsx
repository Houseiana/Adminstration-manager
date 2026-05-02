"use client";

type Size = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: Size;
  className?: string;
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-12 h-12",
  xl: "w-24 h-24",
};

const ICON_SIZES: Record<Size, number> = {
  sm: 18,
  md: 20,
  lg: 26,
  xl: 56,
};

export function Avatar({ src, alt = "", size = "md", className = "" }: AvatarProps) {
  const base = `${SIZE_CLASSES[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`${base} object-cover bg-slate-100`} />
    );
  }
  return (
    <div
      className={`${base} bg-slate-100 grid place-items-center text-slate-400`}
      aria-label={alt}
    >
      <svg
        width={ICON_SIZES[size]}
        height={ICON_SIZES[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

// Resize an image File client-side to a max dimension and return a JPEG data URL.
export async function fileToResizedDataUrl(
  file: File,
  maxSize = 320,
  quality = 0.85
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });

  let { width, height } = img;
  if (width > height && width > maxSize) {
    height = Math.round(height * (maxSize / width));
    width = maxSize;
  } else if (height >= width && height > maxSize) {
    width = Math.round(width * (maxSize / height));
    height = maxSize;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
