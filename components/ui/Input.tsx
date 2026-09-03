import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const base =
  "w-full bg-white border-b-2 border-black py-3 px-1 font-body text-black placeholder:italic placeholder:text-[#525252] focus:outline-none focus:border-b-[4px] instant";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => <input ref={ref} className={`${base} ${className}`} {...props} />
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => <textarea ref={ref} className={`${base} ${className}`} {...props} />
);
Textarea.displayName = "Textarea";

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block font-mono text-xs uppercase tracking-widest text-[#525252] mb-2">{children}</label>;
}
