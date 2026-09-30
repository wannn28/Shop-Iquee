import Image from "next/image";

import { cn } from "@/lib/cn";
import { BLUR_DATA_URL } from "@/lib/image";

export function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      className={cn("object-cover", className)}
    />
  );
}
