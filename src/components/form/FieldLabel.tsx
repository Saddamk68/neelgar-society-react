import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
};
export default function FieldLabel({ children, required, htmlFor, className }: Props) {
  return (
    <label htmlFor={htmlFor} className={["block text-sm mb-1", className].filter(Boolean).join(" ")}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
