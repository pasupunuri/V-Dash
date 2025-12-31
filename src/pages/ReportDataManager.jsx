import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parse, isValid } from 'date-fns';
import {
  Calendar,
  Save,
  RotateCcw,
  Calculator,
  History,
  Building,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/store/api';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';
import AuditLogModal from '@/components/report-data/AuditLogModal';
import CalculateMTDModal from '@/components/report-data/CalculateMTDModal';
import FieldTable from '@/components/report-data/FieldTable';

const ReportDataManager = () => {
  const { toast } = useToast();
  const currentUser = useAuthStore(state => state.user);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const selectedHotelFromStore = usePropertyStore(state => state.selectedHotel);

  // State
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [initialPropertySet, setInitialPropertySet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fieldGroups, setFieldGroups] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showMTDModal, setShowMTDModal] = useState(false);
  const [activeTab, setActiveTab] = useState('revenue_kpis');
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Get property name for header
  const selectedProperty = properties.find(p => p._id === selectedPropertyId);

  // Load properties
  const loadProperties = async () => {
    try {
      const response = await api.get('properties');
      const activeProperties = (response.data || []).filter(p => p.active);
      setProperties(activeProperties);

      // Pre-select property from header selection (by name) or default to first
      if (activeProperties.length > 0 && !initialPropertySet) {
        let propertyToSelect = activeProperties[0];

        // Try to find property matching the header selection
        if (selectedHotelFromStore) {
          const matchingProperty = activeProperties.find(p => p.name === selectedHotelFromStore);
          if (matchingProperty) {
            propertyToSelect = matchingProperty;
          }
        }

        setSelectedPropertyId(propertyToSelect._id);
        setInitialPropertySet(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load properties',
        variant: 'destructive',
      });
    }
  };

  // Load field groups configuration
  const loadFieldGroups = async () => {
    try {
      const response = await api.get('report-data/fields');
      setFieldGroups(response.data || []);
      if (response.data?.length > 0) {
        setActiveTab(response.data[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load field definitions',
        variant: 'destructive',
      });
    }
  };

  // Load report data for selected property and date
  const loadReportData = useCallback(async () => {
    if (!selectedPropertyId || !selectedDate) return;

    try {
      setLoading(true);
      const response = await api.get(`report-data/${selectedPropertyId}`, {
        params: { date: selectedDate }
      });
      setReportData(response.data);
      setEditedFields({});
      setValidationErrors({});
      setIsCreateMode(!response.data?.exists);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load report data',
        variant: 'destructive',
      });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, selectedDate, toast]);

  // Initial load
  useEffect(() => {
    loadProperties();
    loadFieldGroups();
  }, []);

  // Sync with header property selection changes
  useEffect(() => {
    if (!selectedHotelFromStore || properties.length === 0) return;

    const matchingProperty = properties.find(p => p.name === selectedHotelFromStore);
    if (matchingProperty && matchingProperty._id !== selectedPropertyId) {
      setSelectedPropertyId(matchingProperty._id);
    }
  }, [selectedHotelFromStore, properties]);

  // Load data when property or date changes
  useEffect(() => {
    if (selectedPropertyId && selectedDate) {
      loadReportData();
    }
  }, [selectedPropertyId, selectedDate, loadReportData]);

  // Handle field edit
  const handleFieldChange = (fieldKey, value) => {
    const originalValue = reportData?.data?.[fieldKey];

    // Validation: cannot empty existing fields
    if (originalValue !== null && originalValue !== undefined && originalValue !== '') {
      if (value === '' || value === null) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldKey]: 'Cannot empty existing field value',
        }));
        return;
      }
    }

    // Clear validation error if exists
    if (validationErrors[fieldKey]) {
      setValidationErrors(prev => {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      });
    }

    // Track edited fields
    setEditedFields(prev => {
      // If value is same as original, remove from edited fields
      if (value === originalValue || (value === '' && originalValue === undefined)) {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [fieldKey]: value };
    });
  };

  // Get current field value (edited or original)
  const getFieldValue = (fieldKey) => {
    if (editedFields.hasOwnProperty(fieldKey)) {
      return editedFields[fieldKey];
    }
    return reportData?.data?.[fieldKey] ?? '';
  };

  // Check if there are unsaved changes
  const hasChanges = Object.keys(editedFields).length > 0;
  const hasErrors = Object.keys(validationErrors).length > 0;

  // Warn user before leaving page with unsaved changes (F14)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  // Save changes
  const handleSave = async () => {
    if (!hasChanges || hasErrors) return;

    try {
      setSaving(true);

      if (isCreateMode) {
        // Create new record
        await api.post('report-data/create', {
          property_id: selectedPropertyId,
          date: selectedDate,
          report_type: 'revenue',
          fields: editedFields,
        });
        toast({
          title: 'Success',
          description: 'Report data created successfully',
        });
      } else {
        // Update existing record
        await api.patch(`report-data/${reportData.data._id}`, {
          fields: editedFields,
        });
        toast({
          title: 'Success',
          description: 'Report data saved successfully',
        });
      }

      // Reload data
      await loadReportData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save report data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    setEditedFields({});
    setValidationErrors({});
  };

  // Navigate date
  const navigateDate = (direction) => {
    const current = parse(selectedDate, 'yyyy-MM-dd', new Date());
    if (!isValid(current)) return;

    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  // Check if user can access this page
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Loading Skeleton Component (F13)
  const FieldTableSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        {/* Tab skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>

        {/* Header skeleton */}
        <div className="mb-4">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Table skeleton */}
        <div className="border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="bg-gray-50 border-b p-3 flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border-b p-3 flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Data Manager</h1>
          <p className="text-gray-600 mt-1">
            View, edit, and manage daily report data for properties
          </p>
        </div>
      </div>

      {/* Controls Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Property Selector */}
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property._id} value={property._id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Status Badge */}
            <div className="flex-1 flex justify-center">
              {loading ? (
                <Badge variant="secondary">Loading...</Badge>
              ) : isCreateMode ? (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  <Plus className="w-3 h-3 mr-1" />
                  New Record
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  Existing Record
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMTDModal(true)}
                disabled={isCreateMode || loading}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate MTD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuditModal(true)}
                disabled={isCreateMode || loading || !reportData?.data?._id}
              >
                <History className="w-4 h-4 mr-2" />
                Audit Log
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Header */}
      {selectedProperty && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProperty.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedProperty.code && `Code: ${selectedProperty.code}`}
                  {selectedProperty.rooms && ` | ${selectedProperty.rooms} rooms`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">
                  {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Groups Tabs - Show skeleton while loading */}
      {loading ? (
        <FieldTableSkeleton />
      ) : fieldGroups.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                {fieldGroups.map((group) => (
                  <TabsTrigger
                    key={group.id}
                    value={group.id}
                    className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
                  >
                    {group.label}
                    {/* Show badge if group has edited fields */}
                    {Object.keys(editedFields).some(key =>
                      group.fields.some(f => {
                        const suffixes = f.suffixes || [];
                        return key === f.key || suffixes.some(s => key === `${f.key}_${s.key}`);
                      })
                    ) && (
                      <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {fieldGroups.map((group) => (
                <TabsContent key={group.id} value={group.id}>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{group.label}</h3>
                    <p className="text-sm text-gray-500">{group.description}</p>
                  </div>

                  <FieldTable
                    fields={group.fields}
                    getValue={getFieldValue}
                    onChange={handleFieldChange}
                    editedFields={editedFields}
                    validationErrors={validationErrors}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {Object.keys(editedFields).length} field(s) modified
              </span>
              {hasErrors && (
                <Badge variant="destructive">
                  {Object.keys(validationErrors).length} validation error(s)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving || hasErrors}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : isCreateMode ? 'Create Record' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      <AuditLogModal
        open={showAuditModal}
        onOpenChange={setShowAuditModal}
        recordId={reportData?.data?._id}
      />

      {/* Calculate MTD Modal */}
      <CalculateMTDModal
        open={showMTDModal}
        onOpenChange={setShowMTDModal}
        recordId={reportData?.data?._id}
        onComplete={loadReportData}
      />
    </div>
  );
};

export default ReportDataManager;
