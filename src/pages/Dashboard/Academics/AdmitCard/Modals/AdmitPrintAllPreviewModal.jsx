import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import AdmitPrintPage from '../AdmitCardPage/AdmitPrintPage';
import ReactDOM from 'react-dom/client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdmitPrintAllPreviewModal = ({ 
  isOpen, 
  onClose, 
  students = [], 
  examConfig,
  className: propClassName,
  academicYear = '2024-2025' 
}) => {
  const componentRef = useRef(null); // For current student preview
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to show loading state
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  // Create a ref for the print content
  const printAllRef = useRef();
  

  // Handle print all functionality
  const handlePrintAll = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Admit Cards - ${examConfig?.name || 'All Students'}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page { 
        size: A4; 
        margin: 0;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0;
          padding: 0;
        }
        .print-page {
          page-break-after: always;
          page-break-inside: avoid;
          height: 100vh;
        }
        .print-page:last-child {
          page-break-after: auto;
        }
      }
    `,
    removeAfterPrint: true
  });


  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200); // Match this with the transition duration
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex min-h-screen items-center justify-center p-4 pt-10 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity duration-200" 
          aria-hidden="true"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            opacity: isVisible ? 0.75 : 0,
            transition: 'opacity 200ms ease-in-out'
          }}
          onClick={handleClose}
        ></div>

        <div 
          className={`inline-block h-[90vh] w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all duration-200 sm:my-8 sm:align-middle ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Print All Admit Cards
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const printAll = async () => {
                      await handlePrintAll();
                    };
                    printAll();
                  }}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ArrowDownTrayIcon className="-ml-1 mr-2 h-4 w-4" />
                  {isPrinting ? 'Preparing...' : 'Print All'}
                </button>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-4">
                Preview of all {students.length} admit cards. Click 'Print All' to print.
              </p>
            </div>

            <div className="mt-4 overflow-auto max-h-[calc(90vh-200px)] relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : null}
              <div ref={componentRef} className={`p-4 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {students.map((student, index) => (
                  <React.Fragment key={student._id}>
                    <div className="border-2 border-gray-200 rounded-lg p-4 print:border-2 print:py-3 mb-6 last:mb-0">
                      <AdmitPrintPage 
                        student={student} 
                        examConfig={examConfig}
                        isPrintMode={true}
                      />
                    </div>
                    {index < students.length - 1 && (
                      <div className="print:hidden border-t border-dashed border-gray-300 my-4 pt-4">
                        <p className="text-xs text-gray-500 text-center">
                          — End of Admit Card {index + 1} of {students.length} —
                        </p>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Hidden div for printing all pages */}
              <div 
                ref={printAllRef} 
                style={{ display: 'none' }}
                className="print-all-content"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmitPrintAllPreviewModal;
