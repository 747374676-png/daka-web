import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getTodayStr, getDateLabel } from '@/data/tracker';
import { format, parseISO, addDays, subDays } from 'date-fns';

interface DateNavSectionProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateNavSection({ selectedDate, onDateChange }: DateNavSectionProps) {
  const today = getTodayStr();
  const isToday = selectedDate === today;

  const goToPrevDay = () => {
    const d = parseISO(selectedDate);
    onDateChange(format(subDays(d, 1), 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    const d = parseISO(selectedDate);
    onDateChange(format(addDays(d, 1), 'yyyy-MM-dd'));
  };

  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={goToPrevDay}
          >
            <ChevronLeft className="size-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="gap-2 px-3 h-9">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {getDateLabel(selectedDate)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={parseISO(selectedDate)}
                onSelect={(d) => {
                  if (d) {
                    onDateChange(format(d, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={goToNextDay}
          >
            <ChevronRight className="size-5" />
          </Button>

          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs ml-2"
              onClick={() => onDateChange(today)}
            >
              回到今天
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
