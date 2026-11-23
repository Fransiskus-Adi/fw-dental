"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  triggerClassName = "",
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <select
        className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-gray-800 lg:hidden"
        value={selectedOption?.value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={selectedOption?.label ?? "Select an option"}
        disabled={disabled}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden lg:flex items-center justify-between gap-2 h-9 px-4 border border-[#008080]/60 rounded-full text-xs bg-white font-extrabold text-[#0f2a4a] outline-none transition-all cursor-pointer shadow-2xs hover:bg-gray-50/50 min-w-[125px] disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`size-3.5 text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 hidden min-w-full bg-white border border-gray-150 rounded-2xl p-1.5 shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1.5 duration-150 lg:block">
          <div className="flex flex-col gap-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                    isSelected
                      ? "bg-gray-100 text-[#0f2a4a]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default CustomSelect;
