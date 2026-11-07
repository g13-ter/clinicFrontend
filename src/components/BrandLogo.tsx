interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-10 w-10" }: BrandLogoProps) {
  return (
    <img
      src="/assets/open-edicto-college-clinic-logo.jpg"
      alt=""
      aria-hidden="true"
      className={`shrink-0 rounded-full object-contain ${className}`}
    />
  );
}
