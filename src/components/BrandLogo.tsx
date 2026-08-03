interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-10 w-10" }: BrandLogoProps) {
  return (
    <img
      src="/assets/schoolcare-logo.svg"
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
