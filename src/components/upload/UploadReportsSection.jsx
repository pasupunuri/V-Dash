// UploadReportsSection component
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePropertyStore } from '@/store/propertyStore';
import { api } from '@/store/api';
import { format } from 'date-fns';
function UploadReportsSection({ selectedDate }) {
  const { toast } = useToast();
  const selectedPropertyName = usePropertyStore((s) => s.selectedHotel);
  const properties = usePropertyStore((s) => s.properties);

  const [reportItems, setReportItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [selectedFiles, setSelectedFiles] = React.useState({});
  const [uploadStatus, setUploadStatus] = React.useState({});
  const [uploadTimestamps, setUploadTimestamps] = React.useState({});
  // Track existing file info per report_id
  const [fileInfoByReportId, setFileInfoByReportId] = React.useState({});

  // Accounting-style property_id derivation (same as BusinessDetails.jsx)
  const propertyId = React.useMemo(() => {
    const match = Array.isArray(properties)
      ? properties.find((p) => p?.name === selectedPropertyName)
      : null;
    return match?.id || match?._id || '68b6cb3a6c280bfb1ac0083c';
  }, [properties, selectedPropertyName]);

  React.useEffect(() => {
    if (!propertyId) {
      setReportItems([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);

    api.get('report-files/property-reports', { params: { property_id: propertyId } })
      .then((res) => {
        const payload = Array.isArray(res) ? res : res?.data?.reports || res?.data || [];
        const items = (payload || []).map((r) => ({
          id: r?.code || r?.id,
          name: r?.name || '',
          type: r?.type || 'pdf',
          ext: r?.ext || 'pdf',
          code: r?.code,
        }));
        if (mounted) setReportItems(items);
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.message || 'Failed to load reports');
          setReportItems([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [propertyId]);
  // Fetch file status for each report_code on load/date change
  React.useEffect(() => {
    if (!propertyId || !selectedDate || reportItems.length === 0) {
      setFileInfoByReportId({});
      return;
    }
    let mounted = true;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const requests = reportItems.map((report) => {
      const code = report?.code || report?.id;
      if (!code) return Promise.resolve({ reportId: report.id, info: null });
      return api.get('report-files/files', {
        params: { property_id: propertyId, report_code: code, date: dateStr }
      })
      .then((res) => {
        const payload = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
        const item = Array.isArray(payload) ? payload[0] : null;
        const info = item ? {
          url: item?.file?.url,
          filename: item?.file?.filename,
          updatedAt: item?.updated_at || item?.created_at,
          parsed: item?.parsed,
          valid: item?.valid,
        } : null;
        return { reportId: report.id, info };
      })
      .catch(() => ({ reportId: report.id, info: null }));
    });
    Promise.all(requests).then((results) => {
      if (!mounted) return;
      const next = {};
      results.forEach(({ reportId, info }) => { next[reportId] = info; });
      setFileInfoByReportId(next);
    });
    return () => { mounted = false; };
  }, [propertyId, selectedDate, reportItems]);
  // Helper to refresh a single report's file info after upload
  const refreshReportFileInfo = async (reportId, reportCode, dateStr) => {
    try {
      const res = await api.get('report-files/files', {
        params: { property_id: propertyId, report_code: reportCode, date: dateStr }
      });
      const payload = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const item = Array.isArray(payload) ? payload[0] : null;
      const info = item ? {
        url: item?.file?.url,
        filename: item?.file?.filename,
        updatedAt: item?.updated_at || item?.created_at,
        parsed: item?.parsed,
        valid: item?.valid,
      } : null;
      setFileInfoByReportId(prev => ({ ...prev, [reportId]: info }));
    } catch (_) {
      // ignore
    }
  };

  const formatTimestampEST = (date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleFileSelect = (reportId, event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFiles(prev => ({ ...prev, [reportId]: file }));
    if (file) setUploadStatus(prev => ({ ...prev, [reportId]: null }));
  };

  const handleUpload = async (reportId) => {
    const file = selectedFiles[reportId];
    const report = reportItems.find(r => r.id === reportId);
    const reportName = report?.name;
    const reportCode = report?.code || report?.id;

    if (!file || !reportCode) {
      toast({
        title: "Missing Data",
        description: !file
          ? `Please select a file for ${reportName} before uploading.`
          : "Report code is missing for this item.",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate || new Date(), 'yyyy-MM-dd');
    setUploadStatus(prev => ({ ...prev, [reportId]: 'uploading' }));

    try {
      await api.postFormData('report-files/files/upload', {
        property_id: propertyId,
        date: dateStr,
        report_code: reportCode,
        file,
      });

      const now = new Date();
      setUploadStatus(prev => ({ ...prev, [reportId]: 'success' }));
      setUploadTimestamps(prev => ({ ...prev, [reportId]: now }));
      toast({ title: "Upload Successful", description: `${reportName} uploaded.` });
      setSelectedFiles(prev => ({ ...prev, [reportId]: null }));
      await refreshReportFileInfo(reportId, reportCode, dateStr);
    } catch (err) {
      const now = new Date();
      setUploadStatus(prev => ({ ...prev, [reportId]: 'failed' }));
      setUploadTimestamps(prev => ({ ...prev, [reportId]: now }));
      toast({
        title: "Upload Failed",
        description: err?.message || `Failed to upload ${reportName}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Reports</h2>
        {loading && <div className="text-sm text-gray-500 mb-2">Loading reports...</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {!loading && !error && reportItems.length === 0 && (
          <div className="text-sm text-gray-500 mb-2">
            No reports available for selected property.
          </div>
        )}
        <div className="space-y-4">
          {reportItems.map((report, index) => (
            <div
              key={report.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border ${
                index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {index + 1}. {report.name}
                  </span>
                  {fileInfoByReportId[report.id]?.updatedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="File available" />
                      <span className="text-xs text-green-600 font-medium">
                        {formatTimestampEST(new Date(fileInfoByReportId[report.id].updatedAt))}
                      </span>
                      <a
                        href={fileInfoByReportId[report.id]?.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">– {(report.type || 'pdf').toUpperCase()} format</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-fit">
                <div className="relative">
                  <Input
                    type="file"
                    accept={report.ext ? `.${report.ext}` : (report.type === 'csv' ? '.csv' : '.pdf')}
                    data-report-id={report.id}
                    onChange={(e) => handleFileSelect(report.id, e)}
                    disabled={uploadStatus[report.id] === 'uploading'}
                    className="w-full sm:w-48"
                  />
                </div>

                <div className="flex gap-2">
                  {uploadStatus[report.id] === 'uploading' ? (
                    <Button size="sm" disabled className="flex-1 sm:flex-none">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Uploading...
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleUpload(report.id)}
                      className="flex-1 sm:flex-none"
                      disabled={!selectedFiles[report.id]}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadReportsSection;