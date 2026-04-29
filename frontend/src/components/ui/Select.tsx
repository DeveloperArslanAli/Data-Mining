import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      helperText,
      disabled = false,
      required = false,
      size = 'md',
      className,
      name,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const selectRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find(option => option.value === value);

    const sizeClasses = {
      sm: 'h-8 px-2 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && listboxRef.current) {
        listboxRef.current.focus();
      }
    }, [isOpen]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setIsOpen(!isOpen);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex(prev => 
              prev < options.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex(prev => 
              prev > 0 ? prev - 1 : options.length - 1
            );
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    const handleOptionClick = (option: SelectOption) => {
      if (option.disabled) return;
      
      onChange?.(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
    };

    const handleOptionKeyDown = (event: React.KeyboardEvent, option: SelectOption) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOptionClick(option);
      }
    };

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative" ref={selectRef}>
          <div
            className={cn(
              'relative w-full border rounded-md bg-white cursor-pointer',
              'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
              sizeClasses[size],
              {
                'border-red-500 focus-within:ring-red-500 focus-within:border-red-500': error,
                'border-gray-300': !error,
                'bg-gray-50 cursor-not-allowed': disabled,
              },
              className
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${name}-label` : undefined}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          >
            <span className={cn(
              'block truncate',
              {
                'text-gray-500': !selectedOption,
                'text-gray-900': selectedOption,
              }
            )}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-400 transition-transform',
                  {
                    'rotate-180': isOpen,
                  }
                )}
              />
            </span>
          </div>

          {isOpen && (
            <ul
              ref={listboxRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
              role="listbox"
              tabIndex={-1}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  className={cn(
                    'relative cursor-pointer select-none px-3 py-2',
                    {
                      'bg-blue-50 text-blue-900': index === focusedIndex,
                      'text-gray-900': !option.disabled && index !== focusedIndex,
                      'text-gray-400 cursor-not-allowed': option.disabled,
                      'bg-gray-100': option.value === value,
                    }
                  )}
                  onClick={() => handleOptionClick(option)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                >
                  <span className="block truncate">{option.label}</span>
                  
                  {option.value === value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <Check className="h-4 w-4 text-blue-600" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${name}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
