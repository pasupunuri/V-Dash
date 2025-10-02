import React, { useState } from 'react';
import MonthYearPicker from '@/components/MonthYearPicker';
import LedgerSummaryTable from '@/components/accounting/LedgerSummaryTable';
import TopARCompaniesTable from '@/components/accounting/TopARCompaniesTable';
import BusinessDetails from '@/components/accounting/BusinessDetails';
import TaxExemptDetail from '@/components/accounting/TaxExemptDetail';
import RoomDetails from '@/components/accounting/RoomDetails';

const Accounting = ({ selectedHotel }) => {
  const [selectedDate, setSelectedDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedHotel}
            </h1>
            
            <div className="flex items-center gap-6">
              <MonthYearPicker
                value={selectedDate}
                onChange={handleDateChange}
                disabledFuture={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LedgerSummaryTable 
          selectedHotel={selectedHotel}
          selectedDate={selectedDate}
        />
        
        <TopARCompaniesTable 
          selectedHotel={selectedHotel}
          selectedDate={selectedDate}
        />
      </div> */}

      <BusinessDetails selectedDate={selectedDate} />

      {/* <TaxExemptDetail selectedDate={selectedDate} /> */}

      {/* <RoomDetails selectedDate={selectedDate} /> */}
    </div>
  );
};

export default Accounting;
