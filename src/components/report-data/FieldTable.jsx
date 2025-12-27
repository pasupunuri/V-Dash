import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Format value for display based on field type
 */
const formatValue = (value, type) => {
  if (value === null || value === undefined || value === '') return '';

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;

  switch (type) {
    case 'currency':
      return numValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case 'percentage':
      return `${numValue.toFixed(1)}%`;
    case 'integer':
      return Math.round(numValue).toLocaleString('en-US');
    case 'decimal':
      return numValue.toFixed(2);
    default:
      return value;
  }
};

/**
 * Editable cell component with inline editing
 */
const EditableCell = ({
  fieldKey,
  value,
  type,
  onChange,
  isEdited,
  error,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const inputRef = React.useRef(null);

  // Sync local value when external value changes
  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Only trigger change if value actually changed
    if (localValue !== value) {
      // Convert to number for numeric types
      let finalValue = localValue;
      if (['currency', 'percentage', 'integer', 'decimal'].includes(type)) {
        if (localValue === '' || localValue === null) {
          finalValue = '';
        } else {
          const parsed = parseFloat(localValue);
          finalValue = isNaN(parsed) ? localValue : parsed;
        }
      }
      onChange(fieldKey, finalValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={['currency', 'percentage', 'integer', 'decimal'].includes(type) ? 'number' : 'text'}
        step={type === 'integer' ? '1' : '0.01'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-8 text-sm',
          error && 'border-red-500 focus:ring-red-500'
        )}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-3 py-2 h-10 flex items-center cursor-pointer rounded border border-transparent',
        'hover:bg-gray-50 hover:border-gray-200 transition-colors',
        isEdited && 'bg-blue-50 border-blue-200',
        error && 'bg-red-50 border-red-200',
        (value === '' || value === null || value === undefined) && 'text-gray-400 italic'
      )}
    >
      {value === '' || value === null || value === undefined
        ? 'Click to edit'
        : formatValue(value, type)}
    </div>
  );
};

/**
 * Field table component for displaying and editing fields
 */
const FieldTable = ({
  fields,
  getValue,
  onChange,
  editedFields,
  validationErrors,
}) => {
  // Separate fields by suffix type
  const timeBasedFields = fields.filter(f => f.suffix_type === 'time_based');
  const balanceFields = fields.filter(f => f.suffix_type === 'balance');
  const standaloneFields = fields.filter(f => f.suffix_type === 'none');

  return (
    <div className="space-y-6">
      {/* Time-based fields (Today/MTD/YTD) */}
      {timeBasedFields.length > 0 && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-48">
                    Field
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">
                    Today
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">
                    MTD
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">
                    YTD
                  </th>
                </tr>
              </thead>
              <tbody>
                {timeBasedFields.map((field) => {
                  const todayKey = `${field.key}_today`;
                  const mtdKey = `${field.key}_mtd`;
                  const ytdKey = `${field.key}_ytd`;

                  return (
                    <tr key={field.key} className="border-b hover:bg-gray-50/50">
                      <td className="py-2 px-4">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-xs text-gray-500">{field.type}</div>
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={todayKey}
                          value={getValue(todayKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(todayKey)}
                          error={validationErrors[todayKey]}
                        />
                        {validationErrors[todayKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[todayKey]}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={mtdKey}
                          value={getValue(mtdKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(mtdKey)}
                          error={validationErrors[mtdKey]}
                        />
                        {validationErrors[mtdKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[mtdKey]}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={ytdKey}
                          value={getValue(ytdKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(ytdKey)}
                          error={validationErrors[ytdKey]}
                        />
                        {validationErrors[ytdKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[ytdKey]}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balance fields (Opening/Net Change/Closing) */}
      {balanceFields.length > 0 && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-48">
                    Field
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">
                    Opening Balance
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">
                    Net Change
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">
                    Closing Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {balanceFields.map((field) => {
                  const openingKey = `${field.key}_opening_balance`;
                  const netKey = `${field.key}_net_change`;
                  const closingKey = `${field.key}_closing_balance`;

                  return (
                    <tr key={field.key} className="border-b hover:bg-gray-50/50">
                      <td className="py-2 px-4">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-xs text-gray-500">{field.type}</div>
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={openingKey}
                          value={getValue(openingKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(openingKey)}
                          error={validationErrors[openingKey]}
                        />
                        {validationErrors[openingKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[openingKey]}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={netKey}
                          value={getValue(netKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(netKey)}
                          error={validationErrors[netKey]}
                        />
                        {validationErrors[netKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[netKey]}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={closingKey}
                          value={getValue(closingKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(closingKey)}
                          error={validationErrors[closingKey]}
                        />
                        {validationErrors[closingKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[closingKey]}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standalone fields */}
      {standaloneFields.length > 0 && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 w-48">
                    Field
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {standaloneFields.map((field) => {
                  const fieldKey = field.field_name || field.key;

                  return (
                    <tr key={field.key} className="border-b hover:bg-gray-50/50">
                      <td className="py-2 px-4">
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-xs text-gray-500">{field.type}</div>
                      </td>
                      <td className="py-2 px-4">
                        <EditableCell
                          fieldKey={fieldKey}
                          value={getValue(fieldKey)}
                          type={field.type}
                          onChange={onChange}
                          isEdited={editedFields.hasOwnProperty(fieldKey)}
                          error={validationErrors[fieldKey]}
                        />
                        {validationErrors[fieldKey] && (
                          <div className="text-xs text-red-600 mt-1">
                            {validationErrors[fieldKey]}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldTable;
