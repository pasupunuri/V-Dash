import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/components/forecasting/utils/formatUtils';
import { api } from '@/store/api';
import { usePropertyStore } from '@/store/propertyStore';
import { Skeleton } from '@/components/ui/skeleton';

const BusinessDetails = () => {
  const properties = usePropertyStore((s) => s.properties);
  const selectedHotel = usePropertyStore((s) => s.selectedHotel);

  const [businessData, setBusinessData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Initialize with current month's date range
  const [startDate, setStartDate] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  });

  const propertyId = React.useMemo(() => {
    const match = Array.isArray(properties)
      ? properties.find((p) => p?.name === selectedHotel)
      : null;
    return match?.id || match?._id || null;
  }, [properties, selectedHotel]);

  // Get all months between start and end date
  const getMonthsInRange = React.useCallback((start, end) => {
    const months = [];
    const startParts = start.split('-');
    const endParts = end.split('-');

    let currentYear = parseInt(startParts[0]);
    let currentMonth = parseInt(startParts[1]);
    const endYear = parseInt(endParts[0]);
    const endMonth = parseInt(endParts[1]);

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      months.push({ year: currentYear, month: currentMonth });
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    return months;
  }, []);

  // Fetch data when dates or property changes
  React.useEffect(() => {
    if (!propertyId || !startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const months = getMonthsInRange(startDate, endDate);

        // Fetch data for all months in the range
        const promises = months.map(({ year, month }) =>
          api.get('reports/revenue/daily-summary', {
            params: { property_id: propertyId, month, year },
          })
        );

        const responses = await Promise.all(promises);

        // Combine and filter data
        const allData = responses.flatMap(res => {
          const rows = Array.isArray(res?.data) ? res.data : [];
          return rows.map((item) => ({
            date: item.date,
            roomRevenue: Number(item.revenue_total_today || 0),
            otherRevenue: Number(item.charges_total_today || 0),
            taxes: Number(item.taxes_total_today || 0),
            cash: Number(item.cash_deposit_total_today || 0),
            amex: Number(item.card_amex_today || 0),
            visa: Number(item.card_visa_today || 0),
            discover: Number(item.card_discover_today || 0),
            mastercard: Number(item.card_master_today || 0),
            directBill: Number(item.direct_bill_balance_closing_balance || 0),
          }));
        });

        // Filter to only include dates within the selected range and sort
        const filtered = allData
          .filter(row => row.date >= startDate && row.date <= endDate)
          .sort((a, b) => a.date.localeCompare(b.date));

        setBusinessData(filtered);
      } catch (err) {
        setError(err?.message || 'Failed to load daily summary');
        setBusinessData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, startDate, endDate, getMonthsInRange]);

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rowDate = new Date(date);
    return rowDate >= today;
  };

  const displayValue = (value, date) => {
    return isFutureDate(date) ? "-" : formatCurrency(value);
  };

  const calculateTotalRevenue = (row) => {
    return row.roomRevenue + row.otherRevenue + row.taxes;
  };

  const calculateTotalDeposits = (row) => {
    return row.cash + row.amex + row.visa + row.discover + row.mastercard + row.directBill;
  };

  const calculateRevenueMiniusDeposits = (row) => {
    return calculateTotalRevenue(row) - calculateTotalDeposits(row);
  };

  const downloadCSV = () => {
    const dataToExport = businessData.filter(row => !isFutureDate(row.date));
    if (dataToExport.length === 0) return;

    const headers = [
      'Date',
      'Room Revenue',
      'Other Revenue',
      'Taxes',
      'Cash',
      'AMEX',
      'VISA',
      'DISCOVER',
      'MasterCard',
      'Direct Bill',
      'Revenue (Minus) Deposits'
    ];

    const rows = dataToExport.map(row => [
      row.date,
      row.roomRevenue,
      row.otherRevenue,
      row.taxes,
      row.cash,
      row.amex,
      row.visa,
      row.discover,
      row.mastercard,
      row.directBill,
      calculateRevenueMiniusDeposits(row)
    ]);

    // Add totals row
    const totals = [
      'Actual Totals',
      dataToExport.reduce((sum, row) => sum + row.roomRevenue, 0),
      dataToExport.reduce((sum, row) => sum + row.otherRevenue, 0),
      dataToExport.reduce((sum, row) => sum + row.taxes, 0),
      dataToExport.reduce((sum, row) => sum + row.cash, 0),
      dataToExport.reduce((sum, row) => sum + row.amex, 0),
      dataToExport.reduce((sum, row) => sum + row.visa, 0),
      dataToExport.reduce((sum, row) => sum + row.discover, 0),
      dataToExport.reduce((sum, row) => sum + row.mastercard, 0),
      dataToExport.reduce((sum, row) => sum + row.directBill, 0),
      dataToExport.reduce((sum, row) => sum + calculateRevenueMiniusDeposits(row), 0)
    ];
    rows.push(totals);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `business-details-${selectedHotel || 'property'}-${startDate}_to_${endDate}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get today's date for max constraint
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Business Details</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSV}
            disabled={loading || businessData.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {/* Date Range Selection */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || today}
              className="w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-sm text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={today}
              className="w-[160px]"
            />
          </div>
          {businessData.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {businessData.length} day{businessData.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="border-r sticky left-0 bg-background z-10">Date</TableHead>
                <TableHead colSpan={3} className="text-center border-r">Revenue (Credits)</TableHead>
                <TableHead colSpan={6} className="text-center border-r">Deposits (Debits)</TableHead>
                <TableHead rowSpan={2} className="text-center border-r">Revenue (Minus) Deposits</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="border-r">Room Revenue</TableHead>
                <TableHead className="border-r">Other Revenue</TableHead>
                <TableHead className="border-r">Taxes</TableHead>
                <TableHead className="border-r">Cash</TableHead>
                <TableHead className="border-r">AMEX</TableHead>
                <TableHead className="border-r">VISA</TableHead>
                <TableHead className="border-r">DISCOVER</TableHead>
                <TableHead className="border-r">MasterCard</TableHead>
                <TableHead className="border-r">Direct Bill</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell className="sticky left-0 bg-background z-10 border-r py-2 px-2">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right border-r py-2 px-2"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {!loading && businessData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                    No data available for selected date range.
                  </TableCell>
                </TableRow>
              )}

              {!loading && businessData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10 border-r py-0.5 px-2">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.roomRevenue, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.otherRevenue, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.taxes, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.cash, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.amex, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.visa, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.discover, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.mastercard, row.date)}</TableCell>
                  <TableCell className="text-right border-r py-0.5 px-2">{displayValue(row.directBill, row.date)}</TableCell>
                  <TableCell className="text-right border-r font-medium py-3 px-2">
                    {isFutureDate(row.date) ? "-" : formatCurrency(calculateRevenueMiniusDeposits(row))}
                  </TableCell>
                </TableRow>
              ))}

              {!loading && businessData.length > 0 && (
                <TableRow className="bg-muted font-semibold border-t-2">
                  <TableCell className="font-bold sticky left-0 bg-muted z-10 border-r py-2 px-2">
                    Actual Totals
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.roomRevenue, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.otherRevenue, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.taxes, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.cash, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.amex, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.visa, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.discover, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.mastercard, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + row.directBill, 0))}
                  </TableCell>
                  <TableCell className="text-right border-r py-2 px-2">
                    {formatCurrency(businessData.filter(row => !isFutureDate(row.date)).reduce((sum, row) => sum + calculateRevenueMiniusDeposits(row), 0))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessDetails;
