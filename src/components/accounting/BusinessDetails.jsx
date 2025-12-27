import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, MessageCircle } from 'lucide-react';
import { formatCurrency } from '@/components/forecasting/utils/formatUtils';
import { api } from '@/store/api';
import { usePropertyStore } from '@/store/propertyStore';
import { Skeleton } from '@/components/ui/skeleton';

const BusinessDetails = ({ selectedDate }) => {

  const properties = usePropertyStore((s) => s.properties);
  const selectedHotel = usePropertyStore((s) => s.selectedHotel);

  const [businessData, setBusinessData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const propertyId = React.useMemo(() => {
    const match = Array.isArray(properties)
      ? properties.find((p) => p?.name === selectedHotel)
      : null;
    // Fallback to provided sample id if not found
    return match?.id || match?._id || '68b6cb3a6c280bfb1ac0083c';
  }, [properties, selectedHotel]);

  React.useEffect(() => {
    const month = Number(selectedDate?.month ?? new Date().getMonth()) + 1; // JS month -> API month
    const year = Number(selectedDate?.year ?? new Date().getFullYear());

    setLoading(true);
    setError(null);

    api
      .get('reports/revenue/daily-summary', {
        params: {
          property_id: propertyId,
          month,
          year,
        },
      })
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const mapped = rows.map((item) => ({
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
        setBusinessData(mapped);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load daily summary');
        setBusinessData([]);
      })
      .finally(() => setLoading(false));
  }, [propertyId, selectedDate?.month, selectedDate?.year]);

  const isFutureDate = (date) => {
    const currentDate = new Date();
    const isCurrentMonth = currentDate.getMonth() === selectedDate.month && currentDate.getFullYear() === selectedDate.year;
    const rowDate = new Date(date);
    return isCurrentMonth && rowDate >= currentDate;
  };

  const displayValue = (value, date) => {
    return isFutureDate(date) ? "-" : formatCurrency(value);
  };

  const calculateTotalRevenue = (row) => {
    return row.roomRevenue + row.otherRevenue + row.taxes;
  };

  const calculateTotalDeposits = (row) => {
    return row.cash + row.amex + row.visa + row.discover + row.mastercard + 
           row.directBill;
  };

  const calculateRevenueMiniusDeposits = (row) => {
    return calculateTotalRevenue(row) - calculateTotalDeposits(row);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Business Details</CardTitle>
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
                    No data available for selected month.
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