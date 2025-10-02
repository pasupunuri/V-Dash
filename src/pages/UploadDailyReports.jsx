// UploadDailyReports component
import React, { useState } from 'react';
import UploadReportsHeader from '../components/upload/UploadReportsHeader';
import UploadReportsSection from '../components/upload/UploadReportsSection';

const UploadDailyReports = ({ selectedHotel }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  return (
    <div className="space-y-6">
      <UploadReportsHeader
        selectedHotel={selectedHotel}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <UploadReportsSection selectedDate={selectedDate} />
    </div>
  );
};

export default UploadDailyReports;
