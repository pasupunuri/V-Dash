// UploadReportsHeader component
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getPropertyWithRooms } from '../../constants/properties';
import { usePropertyStore } from '@/store/propertyStore';

const UploadReportsHeader = ({ selectedHotel, selectedDate, onDateChange }) => {
  const selectedPropertyName = usePropertyStore((s) => s.selectedHotel);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {selectedPropertyName || 'Select a property'}
        </h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default UploadReportsHeader;