import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download } from 'lucide-react';
import VarianceCell from './forecasting/components/VarianceCell';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePropertyStore } from '@/store/propertyStore';
import { getPropertyWithRooms } from '../constants/properties';

const VarianceTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [topTab, setTopTab] = useState('daily');
  const [bottomTab, setBottomTab] = useState('last-year');

  // Custom Date Range State
  const [customStartDate, setCustomStartDate] = useState();
  const [customEndDate, setCustomEndDate] = useState();
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  // Use property store to load and read properties
  const properties = usePropertyStore((s) => s.properties);
  const loading = usePropertyStore((s) => s.loading);
  const initialized = usePropertyStore((s) => s.initialized);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);

  React.useEffect(() => {
    if (!initialized && !loading) {
      fetchProperties();
    }
  }, [initialized, loading, fetchProperties]);

  // If switching away from custom, clear dates
  React.useEffect(() => {
    if (topTab !== 'custom') {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  }, [topTab]);

  // Sample data for the table with variance scenarios
  const getTableData = () => {
    // Instead of hardcoded hotel list, use PROPERTIES
    const propertyList = Array.isArray(properties) ? properties : [];
    const baseData = propertyList.map((p, i) => ({
      name: p?.name || `Property ${i + 1}`,
      rooms: p?.rooms ?? null,
      roomsOccupied: 150 + (i % 10) * 5,
      roomRevenue: 40000 + (i % 7) * 3500,
      fnbRevenue: 10000 + (i % 4) * 2000,
      otherRevenue: 2500 + (i % 3) * 1000,
      grossRevenue: 52500 + (i % 8) * 5000,
      occupancy: 80 + (i % 5) * 3,
      adr: 265 + (i % 6) * 10,
      revpar: 220 + (i % 7) * 7,
      noShow: 3 + (i % 4),
      ooo: 2 + (i % 3),
      compRooms: 6 + (i % 3)
    }));
    // Apply multipliers based on top tab selection
    const multipliers = {
      daily: 1,
      mtd: 8.5,
      ytd: 95,
      custom: 15
    };

    let multiplier = multipliers[topTab] ?? 1;

    // For custom, dynamically change multiplier by date range
    if (topTab === "custom" && customStartDate && customEndDate) {
      const days =
        (customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
      multiplier = days > 0 ? days : 1;
    }

    return baseData.map(hotel => ({
      ...hotel,
      roomsOccupied: Math.round(hotel.roomsOccupied * multiplier),
      roomRevenue: Math.round(hotel.roomRevenue * multiplier),
      fnbRevenue: Math.round(hotel.fnbRevenue * multiplier),
      otherRevenue: Math.round(hotel.otherRevenue * multiplier),
      grossRevenue: Math.round(hotel.grossRevenue * multiplier),
      noShow: Math.round(hotel.noShow * multiplier),
      ooo: Math.round(hotel.ooo * multiplier),
      compRooms: Math.round(hotel.compRooms * multiplier),
    }));
  };

  const getComparisonData = (actualValue) => {
    const variations = {
      'last-year': 0.92, // 8% lower than actual
      'budget': 1.05,    // 5% higher than actual
      'year-before': 0.85 // 15% lower than actual
    };
    
    return actualValue * (variations[bottomTab] ?? 1);
  };

  // --- Only generate table data if not on custom OR (on custom and both dates picked) ---
  const canShowTable =
    topTab !== 'custom' || (topTab === 'custom' && customStartDate && customEndDate);

  // Table data logic - if on custom, modify the date range calculation for the mapping
  const tableData = canShowTable
    ? getTableData().filter(hotel => 
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Calculate totals
  const totals = tableData.reduce((acc, hotel) => ({
    roomsOccupied: acc.roomsOccupied + hotel.roomsOccupied,
    roomRevenue: acc.roomRevenue + hotel.roomRevenue,
    fnbRevenue: acc.fnbRevenue + hotel.fnbRevenue,
    otherRevenue: acc.otherRevenue + hotel.otherRevenue,
    grossRevenue: acc.grossRevenue + hotel.grossRevenue,
    occupancy: acc.occupancy + hotel.occupancy,
    adr: acc.adr + hotel.adr,
    revpar: acc.revpar + hotel.revpar,
    noShow: acc.noShow + hotel.noShow,
    ooo: acc.ooo + hotel.ooo,
    compRooms: acc.compRooms + hotel.compRooms,
  }), {
    roomsOccupied: 0, roomRevenue: 0, fnbRevenue: 0, otherRevenue: 0, grossRevenue: 0,
    occupancy: 0, adr: 0, revpar: 0, noShow: 0, ooo: 0, compRooms: 0
  });

  // Calculate averages for percentage-based metrics
  totals.occupancy = totals.occupancy / tableData.length;
  totals.adr = totals.adr / tableData.length;
  totals.revpar = totals.revpar / tableData.length;

  const downloadCSV = () => {
    const headers = [
      'Name', 'Rooms Occupied', 'Room Revenue', 'F&B Revenue', 'Other Revenue',
      'Gross Revenue', 'Occupancy (%)', 'ADR', 'RevPAR', 'No Show', 'OoO', 'Comp Rooms'
    ];

    const csvContent = [
      headers.join(','),
      ...tableData.map(row => [
        `"${row.name}"`, row.roomsOccupied, row.roomRevenue, row.fnbRevenue,
        row.otherRevenue, row.grossRevenue, row.occupancy, row.adr,
        row.revpar, row.noShow, row.ooo, row.compRooms
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'business-performance-summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Business Performance Summary</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder:text-gray-400"
            />
          </div>
          <Button
            onClick={downloadCSV}
            variant="outline"
            size="icon"
            className="h-10 w-10"
            title="Download CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={topTab} onValueChange={setTopTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="mtd">MTD</TabsTrigger>
          <TabsTrigger value="ytd">YTD</TabsTrigger>
          <TabsTrigger value="custom">
            {topTab === 'custom' && (!customStartDate || !customEndDate)
              ? 'Custom Dates (Select Dates)'
              : 'Custom Dates'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Show date range inputs if on custom tab */}
      {topTab === 'custom' && (
        <div className="flex items-center gap-6 mb-4">
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-gray-300">Start Date</label>
            <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[170px] justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(d) => {
                    setCustomStartDate(d);
                    setStartPickerOpen(false);
                    if (!customEndDate) setEndPickerOpen(true);
                  }}
                  disabled={date =>
                    (!!customEndDate && date > customEndDate) ||
                    date > new Date()
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-gray-300">End Date</label>
            <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[170px] justify-start text-left font-normal",
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(d) => {
                    setCustomEndDate(d);
                    setEndPickerOpen(false);
                  }}
                  disabled={date =>
                    (!!customStartDate && date < customStartDate) ||
                    date > new Date()
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Only show table if not on custom OR both dates selected on custom */}
      {canShowTable && (
        <div className="mb-6">
          <ScrollArea className="h-[600px] w-full rounded-md border">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <TableHead className="sticky left-0 bg-gray-50 dark:bg-gray-700 z-20 min-w-[200px] font-semibold">Name</TableHead>
                  <TableHead className="text-center font-semibold min-w-[120px]">Rooms Occupied</TableHead>
                  <TableHead className="text-center font-semibold min-w-[130px]">Room Revenue</TableHead>
                  {/* F&B Revenue column removed */}
                  <TableHead className="text-center font-semibold min-w-[130px]">Other Revenue</TableHead>
                  <TableHead className="text-center font-semibold min-w-[130px]">Gross Revenue</TableHead>
                  <TableHead className="text-center font-semibold min-w-[120px]">Occupancy (%)</TableHead>
                  <TableHead className="text-center font-semibold min-w-[100px]">ADR</TableHead>
                  <TableHead className="text-center font-semibold min-w-[100px]">RevPAR</TableHead>
                  <TableHead className="text-center font-semibold min-w-[100px]">No Show</TableHead>
                  <TableHead className="text-center font-semibold min-w-[100px]">OoO</TableHead>
                  <TableHead className="text-center font-semibold min-w-[120px]">Comp Rooms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((hotel, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="sticky left-0 bg-white dark:bg-gray-800 z-10 font-medium min-w-[200px]">
                      {hotel?.rooms ? `${hotel.name} (${hotel.rooms})` : hotel.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{hotel.roomsOccupied}</div>
                        <VarianceCell 
                          actual={hotel.roomsOccupied} 
                          comparison={getComparisonData(hotel.roomsOccupied)}
                          isWholeNumber
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(hotel.roomRevenue)}</div>
                        <VarianceCell 
                          actual={hotel.roomRevenue} 
                          comparison={getComparisonData(hotel.roomRevenue)} 
                          isCurrency
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(hotel.otherRevenue)}</div>
                        <VarianceCell 
                          actual={hotel.otherRevenue} 
                          comparison={getComparisonData(hotel.otherRevenue)} 
                          isCurrency
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(hotel.grossRevenue)}</div>
                        <VarianceCell 
                          actual={hotel.grossRevenue} 
                          comparison={getComparisonData(hotel.grossRevenue)} 
                          isCurrency
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{formatPercentage(hotel.occupancy)}</div>
                        <VarianceCell 
                          actual={hotel.occupancy} 
                          comparison={getComparisonData(hotel.occupancy)} 
                          isPercentage
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(hotel.adr)}</div>
                        <VarianceCell 
                          actual={hotel.adr} 
                          comparison={getComparisonData(hotel.adr)} 
                          isCurrency
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(hotel.revpar)}</div>
                        <VarianceCell 
                          actual={hotel.revpar} 
                          comparison={getComparisonData(hotel.revpar)} 
                          isCurrency
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{hotel.noShow}</div>
                        <VarianceCell 
                          actual={hotel.noShow} 
                          comparison={getComparisonData(hotel.noShow)}
                          isWholeNumber
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{hotel.ooo}</div>
                        <VarianceCell 
                          actual={hotel.ooo} 
                          comparison={getComparisonData(hotel.ooo)}
                          isWholeNumber
                          invertColors
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{hotel.compRooms}</div>
                        <VarianceCell 
                          actual={hotel.compRooms} 
                          comparison={getComparisonData(hotel.compRooms)}
                          isWholeNumber
                          invertColors
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-100 dark:bg-gray-600 font-semibold border-t-2 sticky bottom-0">
                  <TableCell className="sticky left-0 bg-gray-100 dark:bg-gray-600 z-20 font-bold">
                    Portfolio Totals
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{totals.roomsOccupied}</div>
                      <VarianceCell 
                        actual={totals.roomsOccupied} 
                        comparison={getComparisonData(totals.roomsOccupied)}
                        isWholeNumber
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{formatCurrency(totals.roomRevenue)}</div>
                      <VarianceCell 
                        actual={totals.roomRevenue} 
                        comparison={getComparisonData(totals.roomRevenue)} 
                        isCurrency
                      />
                    </div>
                  </TableCell>
                  {/* F&B Revenue totals cell removed */}
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{formatCurrency(totals.otherRevenue)}</div>
                      <VarianceCell 
                        actual={totals.otherRevenue} 
                        comparison={getComparisonData(totals.otherRevenue)} 
                        isCurrency
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{formatCurrency(totals.grossRevenue)}</div>
                      <VarianceCell 
                        actual={totals.grossRevenue} 
                        comparison={getComparisonData(totals.grossRevenue)} 
                        isCurrency
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{formatPercentage(totals.occupancy)}</div>
                      <VarianceCell 
                        actual={totals.occupancy} 
                        comparison={getComparisonData(totals.occupancy)} 
                        isPercentage
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{formatCurrency(totals.adr)}</div>
                      <VarianceCell 
                        actual={totals.adr} 
                        comparison={getComparisonData(totals.adr)} 
                        isCurrency
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{formatCurrency(totals.revpar)}</div>
                      <VarianceCell 
                        actual={totals.revpar} 
                        comparison={getComparisonData(totals.revpar)} 
                        isCurrency
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{totals.noShow}</div>
                      <VarianceCell 
                        actual={totals.noShow} 
                        comparison={getComparisonData(totals.noShow)}
                        isWholeNumber
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{totals.ooo}</div>
                      <VarianceCell 
                        actual={totals.ooo} 
                        comparison={getComparisonData(totals.ooo)}
                        isWholeNumber
                        invertColors
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-bold">{totals.compRooms}</div>
                      <VarianceCell 
                        actual={totals.compRooms} 
                        comparison={getComparisonData(totals.compRooms)}
                        isWholeNumber
                        invertColors
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {topTab === 'custom' && (!customStartDate || !customEndDate) && (
        <div className="text-gray-500 text-center font-medium mb-8">
          Please select a start and end date to display data for the selected range.
        </div>
      )}

      <Tabs value={bottomTab} onValueChange={setBottomTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="last-year">Last Year Variance</TabsTrigger>
          {/* <TabsTrigger value="budget">Budget Variance</TabsTrigger> */}
          {/* <TabsTrigger value="year-before">Year Before Last Variance</TabsTrigger> */}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default VarianceTable;
