import React from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FloatingInput({ label, className = '', ...props }: FloatingInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <input
        {...props}
        className="block px-3 pb-2 pt-5 w-full text-sm text-foreground bg-white rounded-md border border-[#D8D8D8] appearance-none focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] peer h-[48px]"
        placeholder=" "
      />
      <label className="absolute text-sm text-secondary-text duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none">
        {label}
      </label>
    </div>
  );
}

interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

export function FloatingSelect({ label, options, className = '', ...props }: FloatingSelectProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <select
        {...props}
        className="block px-3 pb-2 pt-5 w-full text-sm text-foreground bg-white rounded-md border border-[#D8D8D8] appearance-none focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] peer h-[48px]"
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <label className="absolute text-sm text-secondary-text duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none">
        {label}
      </label>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-text">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
}
