"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils/helpers"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  minDate,
  maxDate,
  disabledDates,
  className
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    if (disabledDates) {
      return disabledDates.some(disabledDate => {
        return format(date, 'yyyy-MM-dd') === format(disabledDate, 'yyyy-MM-dd');
      });
    }
    
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={isDateDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

