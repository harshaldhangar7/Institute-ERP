import React from 'react';

interface MultiSelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelect({ label, error, options, value, onChange }: MultiSelectProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className={`border rounded-md p-2 max-h-40 overflow-y-auto bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}>
        {options.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">No options available</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))
        )}
      </div>
      {value.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">{value.length} module{value.length !== 1 ? 's' : ''} selected</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
