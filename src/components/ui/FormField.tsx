import React from 'react';

interface FormFieldProps {
  label: string;
  subtext?: string;
  suffix?: string;
  type?: string;
  isSelect?: boolean;
  options?: string[];
  [key: string]: any;
}

export const FormField = ({ label, subtext, suffix, type = "text", isSelect, options, ...props }: FormFieldProps) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      
      <div className="relative">
        {isSelect && options ? (
          <select 
            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 appearance-none"
            {...props}
          >
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea 
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 min-h-[80px]"
            {...props}
          />
        ) : (
          <input 
            type={type}
            className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 ${suffix ? 'pr-12' : ''}`}
            {...props}
          />
        )}
        {suffix && (
          <span className="absolute right-3 top-2.5 text-sm text-gray-400">
            {suffix}
          </span>
        )}
      </div>
      {subtext && (
        <span className="text-[11px] text-gray-400 mt-1.5">
          {subtext}
        </span>
      )}
    </div>
  );
};
