import type { TextareaHTMLAttributes } from "react";

const baseClasses =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:opacity-60";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({
  className = "",
  invalid = false,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${baseClasses} ${invalid ? "ring-red-400 focus:ring-red-500" : ""} ${className}`}
      {...rest}
    />
  );
}
