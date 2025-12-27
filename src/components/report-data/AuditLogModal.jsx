import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  User,
  ArrowRight,
  FileEdit,
  PlusCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '@/store/api';
import { cn } from '@/lib/utils';

/**
 * Format value for display
 */
const formatDisplayValue = (value) => {
  if (value === null || value === undefined) return 'empty';
  if (value === '') return 'empty';
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return String(value);
};

/**
 * Get action icon based on action type
 */
const ActionIcon = ({ action }) => {
  switch (action) {
    case 'create':
      return <PlusCircle className="w-4 h-4 text-green-600" />;
    case 'update':
      return <FileEdit className="w-4 h-4 text-blue-600" />;
    case 'calculate_mtd':
      return <Calculator className="w-4 h-4 text-purple-600" />;
    default:
      return <FileEdit className="w-4 h-4 text-gray-600" />;
  }
};

/**
 * Get action label
 */
const getActionLabel = (action) => {
  switch (action) {
    case 'create':
      return 'Created';
    case 'update':
      return 'Updated';
    case 'calculate_mtd':
      return 'MTD Calculated';
    default:
      return action;
  }
};

/**
 * Get action color
 */
const getActionColor = (action) => {
  switch (action) {
    case 'create':
      return 'bg-green-100 text-green-800';
    case 'update':
      return 'bg-blue-100 text-blue-800';
    case 'calculate_mtd':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Single change item in diff view
 */
const ChangeItem = ({ fieldKey, change }) => {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-sm">
      <span className="font-medium text-gray-700 min-w-32">
        {change.label || fieldKey}
      </span>
      <span className="text-gray-500 bg-red-50 px-2 py-0.5 rounded">
        {formatDisplayValue(change.old)}
      </span>
      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-gray-900 bg-green-50 px-2 py-0.5 rounded font-medium">
        {formatDisplayValue(change.new)}
      </span>
    </div>
  );
};

/**
 * Timeline entry component
 */
const TimelineEntry = ({ entry, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const changeCount = Object.keys(entry.changes || {}).length;

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
      )}

      <div className="flex gap-4">
        {/* Timeline dot */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
          <ActionIcon action={entry.action} />
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <div className="bg-white border rounded-lg shadow-sm">
            {/* Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={cn('text-xs', getActionColor(entry.action))}>
                    {getActionLabel(entry.action)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {changeCount} field(s) changed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{entry.user_email || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {entry.timestamp
                      ? format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')
                      : 'Unknown time'}
                  </span>
                </div>
              </div>
            </div>

            {/* Changes (expanded) */}
            {isExpanded && entry.changes && (
              <div className="border-t px-4 py-3 space-y-2">
                {Object.entries(entry.changes).map(([fieldKey, change]) => (
                  <ChangeItem key={fieldKey} fieldKey={fieldKey} change={change} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Diff view component - shows all changes in a single table
 */
const DiffView = ({ auditLog }) => {
  // Collect all changes from all entries
  const allChanges = [];
  auditLog.forEach((entry) => {
    if (entry.changes) {
      Object.entries(entry.changes).forEach(([fieldKey, change]) => {
        allChanges.push({
          fieldKey,
          ...change,
          action: entry.action,
          user_email: entry.user_email,
          timestamp: entry.timestamp,
        });
      });
    }
  });

  if (allChanges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No changes recorded
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Field</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Old Value</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">New Value</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Changed By</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {allChanges.map((change, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="py-2 px-4 font-medium text-gray-900">
                {change.label || change.fieldKey}
              </td>
              <td className="py-2 px-4">
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">
                  {formatDisplayValue(change.old)}
                </span>
              </td>
              <td className="py-2 px-4">
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  {formatDisplayValue(change.new)}
                </span>
              </td>
              <td className="py-2 px-4">
                <Badge className={cn('text-xs', getActionColor(change.action))}>
                  {getActionLabel(change.action)}
                </Badge>
              </td>
              <td className="py-2 px-4 text-gray-600">{change.user_email}</td>
              <td className="py-2 px-4 text-gray-600">
                {change.timestamp
                  ? format(new Date(change.timestamp), 'MMM d, yyyy h:mm a')
                  : 'Unknown'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Audit Log Modal component
 */
const AuditLogModal = ({ open, onOpenChange, recordId }) => {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('timeline');

  useEffect(() => {
    if (open && recordId) {
      loadAuditLog();
    }
  }, [open, recordId]);

  const loadAuditLog = async () => {
    if (!recordId) return;

    try {
      setLoading(true);
      const response = await api.get(`report-data/${recordId}/audit`);
      setAuditData(response.data);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Audit Log
            {auditData?.date && (
              <span className="text-gray-500 font-normal ml-2">
                - {format(new Date(auditData.date), 'MMMM d, yyyy')}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500">Loading audit log...</span>
          </div>
        ) : auditData?.audit_log?.length > 0 ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={viewMode} onValueChange={setViewMode} className="flex-1 flex flex-col">
              <TabsList className="mb-4 w-fit">
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="diff">Diff View</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="flex-1 overflow-auto">
                <div className="space-y-0 pr-2">
                  {auditData.audit_log.map((entry, index) => (
                    <TimelineEntry
                      key={index}
                      entry={entry}
                      isLast={index === auditData.audit_log.length - 1}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="diff" className="flex-1 overflow-auto">
                <DiffView auditLog={auditData.audit_log} />
              </TabsContent>
            </Tabs>

            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {auditData.total_entries} total entries
              </span>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No audit entries found</p>
            <p className="text-sm">Changes to this record will be tracked here</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogModal;
