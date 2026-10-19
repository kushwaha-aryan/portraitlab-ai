"use client";

import { ChevronDown } from "lucide-react";

interface FieldSelectProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  disabled?: boolean;
  onChange: (value: T) => void;
}

export function FieldSelect<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: FieldSelectProps<T>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-600">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          className="w-full appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-3 pr-8 text-sm text-stone-800 shadow-sm transition focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-stone-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-stone-500">
            {description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "bg-stone-900" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
