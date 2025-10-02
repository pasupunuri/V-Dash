import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table as TableIcon } from 'lucide-react';

const LedgerSummaryTable = ({ selectedHotel, selectedDate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const ledgerData = [
    { name: 'Advance Deposit Ledger', amount: 125000 },
    { name: 'City Ledger', amount: 45000 },
    { name: 'Guest Ledger', amount: 75000 },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Generate detailed ledger data
  const generateDetailedData = () => {
    const currentDate = new Date();
    const isCurrentMonth =
      selectedDate.month === currentDate.getMonth() &&
      selectedDate.year === currentDate.getFullYear();
    const daysInMonth = new Date(
      selectedDate.year,
      selectedDate.month + 1,
      0
    ).getDate();
    const endDay = isCurrentMonth ? currentDate.getDate() - 1 : daysInMonth;

    const detailedData = [];
    for (let day = 1; day <= endDay; day++) {
      const date = new Date(selectedDate.year, selectedDate.month, day);
      detailedData.push({
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
        }),
        advanceDeposits: Math.floor(Math.random() * 5000) + 1000,
        guestLedger: Math.floor(Math.random() * 3000) + 500,
        cityLedger: Math.floor(Math.random() * 2000) + 300,
      });
    }
    return detailedData;
  };

  const detailedData = generateDetailedData();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Ledger Summary</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-1 hover:bg-accent rounded-sm transition-colors">
                <TableIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Ledger Details -{' '}
                  {new Date(
                    selectedDate.year,
                    selectedDate.month
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm font-medium">Date</TableHead>
                      <TableHead className="text-right text-sm font-medium">
                        Advance Deposits
                      </TableHead>
                      <TableHead className="text-right text-sm font-medium">
                        Guest Ledger
                      </TableHead>
                      <TableHead className="text-right text-sm font-medium">
                        City Ledger
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm py-2">
                          {row.date}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(row.advanceDeposits)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(row.guestLedger)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(row.cityLedger)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/3 text-sm font-medium">
                Ledger Name
              </TableHead>
              <TableHead className="w-1/3 text-right text-sm font-medium">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerData.map((entry, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-sm py-2 pr-2">
                  {entry.name}
                </TableCell>
                <TableCell className="text-right font-mono text-sm py-2 pl-2">
                  {formatCurrency(entry.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LedgerSummaryTable;
