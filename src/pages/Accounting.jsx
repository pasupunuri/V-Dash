import React from 'react';
import BusinessDetails from '@/components/accounting/BusinessDetails';
import { usePropertyStore } from '@/store/propertyStore';
import { getPropertyWithRooms } from '@/constants/properties';

const Accounting = ({ selectedHotel }) => {
  const selectedProperty = usePropertyStore((s) => s.selectedHotel);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getPropertyWithRooms(selectedHotel || selectedProperty)}
            </h1>
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

      <BusinessDetails />

      {/* <TaxExemptDetail selectedDate={selectedDate} /> */}

      {/* <RoomDetails selectedDate={selectedDate} /> */}
    </div>
  );
};

export default Accounting;
