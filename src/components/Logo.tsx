import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "mark";
  className?: string;
  footer?: boolean;
};

export default function Logo({
  variant = "full",
  className,
  footer = false,
}: LogoProps) {
  if (variant === "mark") {
    return (
      <Link
        href="/"
        className={cn("inline-flex shrink-0 items-center", className)}
        aria-label="ToolSpotAI home"
      >
        <Image
          src="/toolspotai-mark.svg"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg"
          priority
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex max-w-[min(100%,220px)] shrink-0 items-center sm:max-w-none",
        footer && "rounded-lg bg-white px-2 py-1.5 ring-1 ring-white/10",
        className,
      )}
    >
      <Image
        src="/toolspotai-logo.svg"
        alt="ToolSpotAI"
        width={240}
        height={40}
        className="h-7 w-auto sm:h-8 md:h-9"
        priority
      />
    </Link>
  );
}
