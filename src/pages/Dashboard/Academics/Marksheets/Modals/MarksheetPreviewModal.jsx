import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { schoolinfo } from '@/shared/schoolInformation';
import MarksheetPrintPage from '../MarksheetPage/MarksheetPrintPage';

const MarksheetPreviewModal = ({
  isOpen,
  onClose,
  processedStudent, // Already processed data
  academicYear = '2025'
}) => {
 
  const printContentRef = useRef();
  const navigate = useNavigate();

  // Use processed data directly - no processing needed here
  const studentData = processedStudent?.student || {};
  const className = studentData.class || '';


  // Handle print functionality
  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    removeAfterPrint: true,
    documentTitle: `Marksheet-${studentData.rollNumber || studentData.rollNo || 'student'}`,
    pageStyle: `
      @page { 
        size: A4;
        margin: 1.5cm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0;
          padding: 0;
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        if (printContentRef.current) {
          resolve();
          return;
        }

        const interval = setInterval(() => {
          if (printContentRef.current) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      setError('Failed to generate print preview. Please try again.');
    }
  });



  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

console.log("studentData",studentData,"className",className,"academicYear",academicYear);
    

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col h-[90vh] max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                      onClick={onClose}
                    >
                      <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {studentData.name}'s Marksheet
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {className} • {academicYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="bg-white dark:bg-gray-700 shadow-lg rounded-lg overflow-hidden">
                    <div className="w-full h-full overflow-auto">
                      
                        <div ref={printContentRef} className="w-full">
                          <MarksheetPrintPage
                            ref={printContentRef}
                            processedStudent={processedStudent}
                            academicYear={academicYear}
                          />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};

export default MarksheetPreviewModal;
