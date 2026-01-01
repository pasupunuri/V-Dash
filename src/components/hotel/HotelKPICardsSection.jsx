// Top-level imports in this file
import React, { useEffect, useMemo, useState } from 'react';
import HotelTimeTabsSection from './HotelTimeTabsSection';
import HotelVarianceTabsSection from './HotelVarianceTabsSection';
import { getCurrentKPIData } from '@/components/KPIDataService';
import KPICardsSkeleton from '@/components/ui/KPICardsSkeleton';
import { format } from 'date-fns';
import { usePropertyStore } from '@/store/propertyStore';
import { getPropertyIdByName } from '@/utils/propertyUtils';
import { api } from '../../store/api';

const getVarianceSuffix = (kpiVarianceTab) => {
  if (kpiVarianceTab === "last-year") return "LYV";
  if (kpiVarianceTab === "budget") return "BV";
  if (kpiVarianceTab === "year-before") return "YBY";
  // fallback, could be extended if needed
  return "";
};

function HotelKPICardsSection({
  kpiTimeTab,
  setKpiTimeTab,
  kpiVarianceTab,
  setKpiVarianceTab,
  selectedDate,
}) {

  // Select fields separately to avoid new object refs each render
  const selectedHotel = usePropertyStore((s) => s.selectedHotel);
  const properties = usePropertyStore((s) => s.properties);

  const [kpiData, setKpiData] = useState(null);

  // Derive property_id without state updates to prevent loops
  const propertyId = useMemo(
    () => getPropertyIdByName(properties, selectedHotel),
    [properties, selectedHotel]
  );

  const fetchApiData = async () => {
    try {
      const resp = await api.get("reports/revenue-kpi", {
        params: {
          property_id: propertyId,
          date: selectedDate
            ? format(
                selectedDate instanceof Date ? selectedDate : new Date(selectedDate),
                'yyyy-MM-dd'
              )
            : '',
        },
      });
      setKpiData(resp?.data || {});
    } catch (err) {
      console.error('Failed to fetch KPI data:', err);
      setKpiData({}); // ensure kpiData is an empty object on error
    }
  };
  useEffect(() => {
    // Only fetch when we have a valid propertyId
    if (!propertyId) {
      return;
    }
    setKpiData(null);
    fetchApiData();
  }, [selectedHotel, propertyId, selectedDate]);
  // Optional: inspect current selection
  // console.log('HotelKPICardsSection selection:', { selectedHotel, property_id: propertyId });

  // Get data based on selected tabs (from the data service)
  const getKPIData = () => ((kpiData[kpiTimeTab] || {})[kpiVarianceTab] || []);

  // Determine the suffix for the variance label
  const varianceSuffix = getVarianceSuffix(kpiVarianceTab);

  // Derive current kpiData and decide loading
  
  // Treat {} as "no data"
  const noKpiData =
    kpiData &&
    typeof kpiData === 'object' &&
    !Array.isArray(kpiData) &&
    Object.keys(kpiData).length === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {kpiData == null ? (
        <KPICardsSkeleton cards={4} />
      ) : (noKpiData) ? (
        <div className="p-6 text-center text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          The data is not available. Data is only available between Jan 1st 2024 till Aug 31st 2025
        </div>
      ) : (
        <>
          <HotelTimeTabsSection
            kpiTimeTab={kpiTimeTab}
            setKpiTimeTab={setKpiTimeTab}
            getCurrentKPIData={getKPIData}
            varianceSuffix={varianceSuffix}
          />
          <HotelVarianceTabsSection
            kpiVarianceTab={kpiVarianceTab}
            setKpiVarianceTab={setKpiVarianceTab}
          />
        </>

      )}

      {/* Bottom tabs for variance */}

    </div>
  );
};

export default HotelKPICardsSection;
