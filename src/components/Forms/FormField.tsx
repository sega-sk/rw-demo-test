import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  id?: string;
}

export default function FormField({ label, required, error, children, id }: FormFieldProps) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  // Safe way to clone element with proper type checking
  const renderChildren = () => {
    if (React.isValidElement(children)) {
      // Only clone if it's a single valid React element
      return React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': errorId,
        'aria-required': required
      });
    }
    
    // Handle React fragments or multiple children
    if (React.Children.count(children) > 1) {
      console.warn('FormField: Multiple children detected. Only single elements can receive id and aria attributes.');
    }
    
    // Return children as-is if not a single element
    return children;
  };

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderChildren()}
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}