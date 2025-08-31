import React from 'react';
import { format } from 'date-fns';

const PrintLayout = ({ title, children, type = 'student' }) => {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const isCoScholastic = type === 'co-scholastic';
  
  return (
    <div className={`print-container p-8 ${isCoScholastic ? 'co-scholastic-print' : ''}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: ${isCoScholastic ? 'A4 portrait' : 'A4 landscape'};
            margin: ${isCoScholastic ? '15mm' : '10mm'};
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: ${isCoScholastic ? '12px' : 'inherit'};
            }
            .no-print, .no-print * {
              display: none !important;
            }
          }
          .print-header {
            border-bottom: 2px solid #000;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            text-align: center;
          }
          .print-header h1 {
            font-size: ${isCoScholastic ? '1.5rem' : '1.75rem'};
            margin-bottom: 0.5rem;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            page-break-inside: avoid;
            font-size: ${isCoScholastic ? '0.85rem' : '0.9rem'};
          }
          .print-table th, 
          .print-table td {
            border: 1px solid #ddd;
            padding: ${isCoScholastic ? '6px' : '8px'};
            text-align: ${isCoScholastic ? 'center' : 'left'};
            vertical-align: middle;
          }
          .print-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            white-space: nowrap;
          }
          .print-footer {
            margin-top: 2rem;
            text-align: right;
            font-size: 0.9em;
            color: #666;
            page-break-after: avoid;
          }
          .co-scholastic-print .print-table th,
          .co-scholastic-print .print-table td {
            padding: 4px 6px;
          }
          .co-scholastic-print .print-header {
            margin-bottom: 0.5rem;
          }
          .co-scholastic-print .print-footer {
            margin-top: 1rem;
          }
          @media print {
            body * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-table {
              page-break-inside: avoid;
            }
            .co-scholastic-print .print-table {
              font-size: 11px;
            }
          }
        `
      }} />
      
      <div className="print-header">
        <h1>{title}</h1>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Generated on: {currentDate}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
      
      <div className="print-content">
        {children}
      </div>
      
      <div className="print-footer">
        <p>© {new Date().getFullYear()} {import.meta.env.VITE_APP_SCHOOL_NAME || 'School Management System'}</p>
      </div>
    </div>
  );
};

export default PrintLayout;
