'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
}

export default function Combobox({
  value,
  onChange,
  options,
  placeholder = 'ค้นหาหรือพิมพ์ใหม่...',
  label,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500 pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelectOption(option)}
              className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 transition ${
                inputValue === option
                  ? 'bg-forest-50 text-forest-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {isOpen && inputValue && filteredOptions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-gray-500">
          ✓ สร้างกลุ่มใหม่: <strong>{inputValue}</strong>
        </div>
      )}
    </div>
  );
}
