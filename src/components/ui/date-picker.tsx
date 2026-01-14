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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Close popover when a complete range is selected
  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setIsOpen(false);
    }
  }, [dateRange?.from, dateRange?.to]);

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



  // Quick filter options
  const quickFilters = [
    { label: "Today", action: () => {
      const today = new Date();
      onDateRangeChange?.({ from: today, to: today });
      setIsOpen(false);
    }},
    { label: "Yesterday", action: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      onDateRangeChange?.({ from: yesterday, to: yesterday });
      setIsOpen(false);
    }},
    { label: "Last 7 days", action: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      onDateRangeChange?.({ from: start, to: end });
      setIsOpen(false);
    }},
    { label: "Last week", action: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - dayOfWeek - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      onDateRangeChange?.({ from: lastWeekStart, to: lastWeekEnd });
      setIsOpen(false);
    }},
    { label: "Last 2 weeks", action: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 13);
      onDateRangeChange?.({ from: start, to: end });
      setIsOpen(false);
    }},
    { label: "This month", action: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      onDateRangeChange?.({ from: start, to: today });
      setIsOpen(false);
    }},
    { label: "Last month", action: () => {
      const today = new Date();
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      onDateRangeChange?.({ from: lastMonthStart, to: lastMonthEnd });
      setIsOpen(false);
    }},
  ];

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
        <div className="flex">
          <div>
                         <Calendar
               mode="range"
               defaultMonth={dateRange?.from}
               selected={dateRange}
               onSelect={(range) => {
                 // Custom logic: if we have 2 dates selected and click a third date,
                 // reset to the new date as the first date
                 if (dateRange?.from && dateRange?.to && range?.from && !range?.to) {
                   // Third date clicked - reset to new first date
                   onDateRangeChange?.({ from: range.from, to: undefined });
                 } else if (dateRange?.from && dateRange?.to && range?.from && range?.to) {
                   // If we have a complete range and user selects a new complete range,
                   // it means they clicked a third date that created a new range
                   // We should reset to just the new first date
                   onDateRangeChange?.({ from: range.from, to: undefined });
                 } else {
                   onDateRangeChange?.(range);
                   // Close popover when both dates are selected
                   if (range?.from && range?.to) {
                     setIsOpen(false);
                   }
                 }
               }}
               disabled={{ after: today }}
               initialFocus
               numberOfMonths={2}
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
          </div>
          <div className="border-l w-[160px]">
            <ScrollArea className="h-full max-h-[350px]">
              <div className="p-2">
                {quickFilters.map((filter, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left mb-1 h-9"
                    onClick={filter.action}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
