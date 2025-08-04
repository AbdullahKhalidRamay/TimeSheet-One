import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, addDays, isFuture, isToday } from "date-fns";
import DailyTrackerForm from "./DailyTrackerForm";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate } from "@/services/storage";

export default function MonthlyTimeTracker() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Generate the days of the selected month
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const monthDays = Array.from({ length: monthEnd.getDate() }, (_, i) => addDays(monthStart, i));

    // Filter out future dates
    const validDates = monthDays.filter(date => !isFuture(date) || isToday(date));
    setSelectedDates(validDates);
  }, [selectedMonth]);

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const nextMonthStart = startOfMonth(nextMonth);

    // Only allow if the month start is not in the future
    if (!isFuture(nextMonthStart) || isToday(nextMonthStart)) {
      setSelectedMonth(nextMonth);
    }
  };

  const handleAddEntry = (date: Date) => {
    setSelectedDateForEntry(date);
    setIsDialogOpen(true);
  };

  const canGoToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    return !isFuture(nextMonthStart) || isToday(nextMonthStart);
  };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Monthly Time Tracker</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {format(monthStart, "MMM yyyy")}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={!canGoToNextMonth()}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {selectedDates.map((currentDate, index) => {
          const day = format(currentDate, "EEEE");
          const isCurrentDay = isToday(currentDate);
          const isFutureDate = isFuture(currentDate) && !isToday(currentDate);

          return (
            <Card key={`day-${index}`} className={`${isCurrentDay ? 'ring-2 ring-primary' : ''} ${isFutureDate ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  {day}
                </CardTitle>
                <div className="text-center">
                  <Badge variant={isCurrentDay ? "default" : "outline"} className="text-xs">
                    {format(currentDate, "MMM dd")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-center space-y-2">
                  {isFutureDate ? (
                    <div className="text-xs text-muted-foreground py-2">
                      Future Date
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAddEntry(currentDate)}
                        className="w-full flex items-center justify-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="text-xs">Add Entry</span>
                      </Button>
                      {(() => {
                        const currentUser = getCurrentUser();
                        if (currentUser) {
                          const { hasEntries, totalHours, entriesCount } = getTimeEntryStatusForDate(
                            format(currentDate, 'yyyy-MM-dd'),
                            currentUser.id
                          );
                          if (hasEntries) {
                            return (
                              <div className="text-xs text-green-600 font-medium">
                                ✓ Done ({entriesCount} {entriesCount === 1 ? 'entry' : 'entries'}, {totalHours.toFixed(1)}h)
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Tracker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add Time Entry for {selectedDateForEntry ? format(selectedDateForEntry, "EEEE, MMMM dd, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <DailyTrackerForm 
              initialDate={selectedDateForEntry ? format(selectedDateForEntry, 'yyyy-MM-dd') : undefined}
              onClose={() => {
                setIsDialogOpen(false);
                setRefreshKey(prev => prev + 1); // Force re-render to show updated status
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
