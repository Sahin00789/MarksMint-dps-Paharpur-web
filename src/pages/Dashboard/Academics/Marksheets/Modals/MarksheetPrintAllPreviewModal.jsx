import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiX, FiPrinter } from 'react-icons/fi';
import MarksheetPrintPage from '../MarksheetPage/MarksheetPrintPage';
import { toast } from 'react-toastify';

const MarksheetPrintAllPreviewModal = ({ 
  isOpen, 
  onClose, 
  studentMarks = {}, 
  selectedClass,
  academicYear = '2025' 
}) => {
  const componentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Convert studentMarks object to array for mapping
  const students = Object.values(studentMarks).sort((a, b) => {
    // Sort by roll number numerically if possible
    const rollA = parseInt(a.student?.rollNo || a.student?.roll) || 0;
    const rollB = parseInt(b.student?.rollNo || b.student?.roll) || 0;
    return rollA - rollB;
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
      setIsVisible(false);
    }
  }, [isOpen]);

  const handlePrintAll = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Marksheets - ${selectedClass || 'Class'}`,
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
        .marksheet-print-container {
          page-break-after: always;
          page-break-inside: avoid;
          min-height: 100vh;
          position: relative;
        }
        .marksheet-print-container:last-child {
          page-break-after: auto;
        }
      }
    `,
  });

  if (!isOpen && !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`fixed inset-0 z-[100] overflow-y-auto transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={handleClose}
        ></div>

        <div className={`inline-block w-full max-w-5xl transform overflow-hidden rounded-2xl bg-gray-50 text-left align-middle shadow-2xl transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bulk Marksheet Preview</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Class: <span className="font-semibold text-blue-600">{selectedClass}</span> • {students.length} Students
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handlePrintAll}
                disabled={isPrinting || isLoading}
                className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
                {isPrinting ? 'Preparing PDF...' : 'Print All Marksheets'}
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                onClick={handleClose}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="relative h-[80vh] overflow-y-auto bg-gray-100/50 p-6">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm z-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Processing marksheets...</p>
              </div>
            ) : null}

            <div ref={componentRef} className="space-y-8 print:space-y-0">
              {students.map((studentData, index) => (
                <div key={studentData.student?.rollNo || index} className="marksheet-print-container">
                  <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-6 print:mb-0 print:shadow-none print:rounded-none mx-auto max-w-[210mm]">
                    <div className="p-1 print:p-0">
                      <MarksheetPrintPage 
                        processedStudent={studentData} 
                        academicYear={academicYear}
                      />
                    </div>
                  </div>
                  
                  {/* Visual separation in preview, hidden in print */}
                  {index < students.length - 1 && (
                    <div className="print:hidden flex items-center justify-center py-4">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <span className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Page {index + 1} of {students.length}
                      </span>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-white px-6 py-3 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 italic font-medium">
              Note: This preview uses A4 paper scaling. Ensure "Background Graphics" is enabled in printer settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetPrintAllPreviewModal;
