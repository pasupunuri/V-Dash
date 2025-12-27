import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { api } from '@/store/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Format value for display
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return String(value);
};

/**
 * Preview item component
 */
const PreviewItem = ({ fieldKey, calculation, isSkipped }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 rounded-lg text-sm',
        isSkipped ? 'bg-gray-50 text-gray-500' : 'bg-blue-50'
      )}
    >
      <span className="font-medium">
        {calculation.label || fieldKey}
      </span>
      <div className="flex items-center gap-2">
        {isSkipped ? (
          <>
            <span className="text-gray-500">
              Current: {formatValue(calculation.current)}
            </span>
            <Badge variant="secondary" className="text-xs">
              Skipped
            </Badge>
          </>
        ) : (
          <>
            <span className="text-gray-500">
              {formatValue(calculation.old)}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-blue-700">
              {formatValue(calculation.new)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Calculate MTD Modal component
 */
const CalculateMTDModal = ({ open, onOpenChange, recordId, onComplete }) => {
  const { toast } = useToast();
  const [applyToEmptyOnly, setApplyToEmptyOnly] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPreview(null);
      setApplyToEmptyOnly(true);
    }
  }, [open]);

  // Load preview when options change
  const loadPreview = async () => {
    if (!recordId) return;

    try {
      setLoading(true);
      const response = await api.post(`report-data/${recordId}/calculate-mtd`, {
        apply_to_empty_only: applyToEmptyOnly,
        preview: true,
      });
      setPreview(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate preview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply calculations
  const applyCalculations = async () => {
    if (!recordId) return;

    try {
      setApplying(true);
      const response = await api.post(`report-data/${recordId}/calculate-mtd`, {
        apply_to_empty_only: applyToEmptyOnly,
        preview: false,
      });

      toast({
        title: 'Success',
        description: `Updated ${response.data.fields_updated} MTD/YTD fields`,
      });

      onOpenChange(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply calculations',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const calculationCount = preview?.calculations ? Object.keys(preview.calculations).length : 0;
  const skippedCount = preview?.skipped ? Object.keys(preview.skipped).length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculate MTD/YTD Values
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How MTD/YTD calculation works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>MTD = Previous day's MTD + Today's value</li>
                <li>YTD = Previous day's YTD + Today's value</li>
                <li>On the first day of the month, MTD = Today's value</li>
                <li>On January 1st, YTD = Today's value</li>
              </ul>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="empty-only"
                checked={applyToEmptyOnly}
                onCheckedChange={setApplyToEmptyOnly}
              />
              <Label htmlFor="empty-only" className="text-sm font-normal">
                Only fill empty MTD/YTD fields (don't overwrite existing values)
              </Label>
            </div>

            <Button
              onClick={loadPreview}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Calculating...' : 'Preview Calculations'}
            </Button>
          </div>

          {/* Preview Results */}
          {preview && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                {preview.previous_record_found ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Previous day record found
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    No previous day record
                  </Badge>
                )}
                <span className="text-sm text-gray-600">
                  {calculationCount} fields to update
                </span>
                {skippedCount > 0 && (
                  <span className="text-sm text-gray-500">
                    ({skippedCount} skipped)
                  </span>
                )}
              </div>

              {/* Calculations */}
              {calculationCount > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Fields to update:
                  </h4>
                  <div className="max-h-48 overflow-auto space-y-1 border rounded-lg p-2">
                    {Object.entries(preview.calculations).map(([key, calc]) => (
                      <PreviewItem
                        key={key}
                        fieldKey={key}
                        calculation={calc}
                        isSkipped={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {skippedCount > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    Skipped (already have values):
                  </h4>
                  <div className="max-h-32 overflow-auto space-y-1 border rounded-lg p-2">
                    {Object.entries(preview.skipped).map(([key, calc]) => (
                      <PreviewItem
                        key={key}
                        fieldKey={key}
                        calculation={calc}
                        isSkipped={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No changes */}
              {calculationCount === 0 && (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No MTD/YTD values to calculate</p>
                  <p className="text-sm">
                    {applyToEmptyOnly
                      ? 'All fields already have values. Uncheck the option above to recalculate.'
                      : 'No today values found to calculate from.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={applyCalculations}
            disabled={applying || !preview || calculationCount === 0}
          >
            {applying ? 'Applying...' : `Apply ${calculationCount} Calculations`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalculateMTDModal;
