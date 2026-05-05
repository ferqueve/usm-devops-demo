"use client"

import { useState, useEffect, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/helpers';

interface TimeSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export function TimeSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "00", 
  className,
  maxLength = 2
}: Readonly<TimeSelectProps>) {
  const [inputValue, setInputValue] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      setIsTyping(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Solo permitir números
    if (!/^\d*$/.test(newValue)) return;
    
    // Limitar longitud
    if (newValue.length > maxLength) return;
    
    setInputValue(newValue);
    setIsTyping(true);

    // Si tiene 2 dígitos, validar y actualizar
    if (newValue.length === maxLength) {
      const numValue = Number.parseInt(newValue);
      
      // Buscar opciones en el rango válido
      const validOptions = options.map(opt => Number.parseInt(opt));
      const minValid = Math.min(...validOptions);
      const maxValid = Math.max(...validOptions);
      
      if (numValue >= minValid && numValue <= maxValid) {
        // Encontrar la opción exacta o la más cercana
        let matchingOption = options.find(opt => Number.parseInt(opt) === numValue);
        
        // Si no hay coincidencia exacta, buscar la más cercana mayor o igual
        if (!matchingOption) {
          matchingOption = options.find(opt => Number.parseInt(opt) >= numValue);
        }
        
        if (matchingOption) {
          onChange(matchingOption);
          setInputValue(matchingOption);
        }
      }
      
      setTimeout(() => setIsTyping(false), 500);
    }
  };

  const handleBlur = () => {
    setIsTyping(false);
    
    // Si el valor es igual al actual, no hacer nada
    if (inputValue === value) return;
    
    const numValue = Number.parseInt(inputValue);
    
    // Si el valor no es válido o está vacío, resetear al valor actual
    if (!inputValue || Number.isNaN(numValue)) {
      setInputValue(value);
      return;
    }
    
    // Buscar la opción más cercana en el rango válido
    const validOptions = options.map(opt => Number.parseInt(opt));
    const minValid = Math.min(...validOptions);
    const maxValid = Math.max(...validOptions);
    
    if (numValue >= minValid && numValue <= maxValid) {
      // Encontrar la opción más cercana
      const matchingOption = options.find(opt => Number.parseInt(opt) >= numValue);
      
      if (matchingOption) {
        onChange(matchingOption);
        setInputValue(matchingOption);
      } else {
        setInputValue(value);
      }
    } else {
      // Si está fuera de rango, resetear al valor actual
      setInputValue(value);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    setInputValue(selectedValue);
    setIsTyping(false);
    onChange(selectedValue);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Input editable */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={isTyping ? inputValue : value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setIsTyping(true)}
          placeholder={placeholder}
          className={cn(
            "w-full pr-8",
            isTyping && "ring-2 ring-ring"
          )}
          maxLength={maxLength}
        />
        {/* Botón de dropdown */}
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground"
          >
            <path
              d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      </div>

      {/* Select invisible para mantener la funcionalidad */}
      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={value}
        onValueChange={handleSelectChange}
      >
        <SelectTrigger className="absolute inset-0 opacity-0 pointer-events-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

