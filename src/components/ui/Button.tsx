"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "@/lib/clsx";

type Variant = "orange" | "green" | "outline-orange" | "outline-green" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  orange: "bg-orange text-white hover:bg-orange-dark",
  green: "bg-green text-white hover:bg-green-dark",
  "outline-orange":
    "bg-transparent text-orange border border-orange hover:bg-orange-light",
  "outline-green":
    "bg-transparent text-green border border-green hover:bg-green-light",
  ghost: "bg-transparent text-muted border border-border hover:bg-surface",
};

export default function Button({
  variant = "orange",
  full,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-fudur text-[15px] font-medium px-[22px] py-[13px] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed",
        variantClasses[variant],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
