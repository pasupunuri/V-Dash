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

const TopARCompaniesTable = ({ selectedHotel, selectedDate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Complete AR data with aging analysis - includes more companies for detailed view
  const completeARData = [
    { companyName: 'Corporate Solutions Inc.', totalOutstanding: 25000, days30: 8000, days60: 7000, days90: 5000, days120: 3000, daysOver120: 2000 },
    { companyName: 'Global Events LLC', totalOutstanding: 18500, days30: 6500, days60: 4500, days90: 3500, days120: 2500, daysOver120: 1500 },
    { companyName: 'Business Travel Group', totalOutstanding: 15200, days30: 5200, days60: 4000, days90: 3000, days120: 2000, daysOver120: 1000 },
    { companyName: 'Conference Partners', totalOutstanding: 12800, days30: 4800, days60: 3000, days90: 2500, days120: 1500, daysOver120: 1000 },
    { companyName: 'Executive Stays Co.', totalOutstanding: 9600, days30: 3600, days60: 2500, days90: 2000, days120: 1000, daysOver120: 500 },
    { companyName: 'Premium Hotels Corp.', totalOutstanding: 8200, days30: 3200, days60: 2000, days90: 1500, days120: 1000, daysOver120: 500 },
    { companyName: 'Travel Alliance Inc.', totalOutstanding: 7500, days30: 2500, days60: 2000, days90: 1500, days120: 1000, daysOver120: 500 },
    { companyName: 'Hospitality Partners', totalOutstanding: 6800, days30: 2800, days60: 1500, days90: 1200, days120: 800, daysOver120: 500 },
  ];

  // Top 5 for the main display
  const arData = completeARData.slice(0, 5);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = () => {
    const date = new Date(selectedDate.year, selectedDate.month);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Top 5 A/R – {formatDate()}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-1 hover:bg-accent rounded-sm transition-colors">
                <TableIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>City Ledger (AR Receivables)</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm font-medium">Company Name</TableHead>
                      <TableHead className="text-right text-sm font-medium">Total Outstanding</TableHead>
                      <TableHead className="text-right text-sm font-medium">≤30 Days</TableHead>
                      <TableHead className="text-right text-sm font-medium">≤60 Days</TableHead>
                      <TableHead className="text-right text-sm font-medium">≤90 Days</TableHead>
                      <TableHead className="text-right text-sm font-medium">≤120 Days</TableHead>
                      <TableHead className="text-right text-sm font-medium">&gt;120 Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeARData.map((company, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm py-2">{company.companyName}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(company.totalOutstanding)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(company.days30)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(company.days60)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(company.days90)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(company.days120)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-2">
                          {formatCurrency(company.daysOver120)}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm font-medium">Company Name</TableHead>
              <TableHead className="text-right text-sm font-medium">Total Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {arData.map((company, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-sm py-2 pr-2">{company.companyName}</TableCell>
                <TableCell className="text-right font-mono text-sm py-2 px-2">
                  {formatCurrency(company.totalOutstanding)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopARCompaniesTable;
