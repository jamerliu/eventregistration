import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "instant inline-flex items-center justify-center gap-2 uppercase tracking-widest text-sm font-medium px-8 py-4 focus-ring disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-black text-white border-2 border-black hover:bg-white hover:text-black",
  secondary: "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white",
  ghost: "bg-transparent text-black border-0 underline-offset-4 hover:underline px-2 py-1",
  danger: "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
);
Button.displayName = "Button";
