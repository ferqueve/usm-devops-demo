import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReactNode } from "react";

export interface FilterField {
  id: string;
  label: string;
  type: 'select' | 'input' | 'date' | 'number';
  value: string | number | undefined;
  placeholder?: string;
  options?: { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface FiltersPanelProps {
  showFilters: boolean;
  fields: FilterField[];
  additionalContent?: ReactNode;
}

export function FiltersPanel({ showFilters, fields, additionalContent }: FiltersPanelProps) {
  return (
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
      showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    }`}>
      <div className={`flex flex-wrap gap-3 pt-2 border-t transition-transform duration-300 ease-in-out ${
        showFilters ? 'translate-y-0' : '-translate-y-2'
      }`}>
        {fields.map((field) => (
          <div key={field.id}>
            <Label htmlFor={field.id} className="text-xs text-muted-foreground mb-1 block">
              {field.label}
            </Label>
            {field.type === 'select' && field.options && (
              <Select 
                value={field.value?.toString() || 'all'} 
                onValueChange={field.onChange}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder={field.placeholder || "Todos"} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {(field.type === 'input' || field.type === 'number' || field.type === 'date') && (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-9"
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenido adicional (como filtros de inventario en espacios) */}
      {additionalContent && showFilters && (
        <div className="mt-3 pt-3 border-t">
          {additionalContent}
        </div>
      )}
    </div>
  );
}

