import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={{ after: today }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange?.(undefined);
  };

  const formatDateRange = (range: DateRange) => {
    if (range.from && range.to) {
      return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
    } else if (range.from) {
      return `${format(range.from, "MMM dd, yyyy")} - Select end date`;
    }
    return placeholder;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal relative",
            !dateRange?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">
            {dateRange?.from ? formatDateRange(dateRange) : placeholder}
          </span>
          {dateRange?.from && (
            <X
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={(range) => {
            onDateRangeChange?.(range);
            // Close popover when both dates are selected
            if (range?.from && range?.to) {
              setIsOpen(false);
            }
          }}
          disabled={{ after: today }}
          initialFocus
        />
        <div className="p-3 border-t">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Select start and end dates</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateRangeChange?.(undefined);
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
