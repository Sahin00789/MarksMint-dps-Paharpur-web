import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useReactToPrint } from 'react-to-print';
import { FiX, FiPrinter } from 'react-icons/fi';
import { Button } from 'react-bootstrap';
import AdmitPrintPage from '../AdmitCardPage/AdmitPrintPage';

const AdmitPrintPreviewModal = ({ isOpen, onClose, student, examConfig: externalExamConfig, selectedExam }) => {
  const printContentRef = useRef();
  const printButtonRef = useRef();
  const [isContentReady, setIsContentReady] = useState(false);
  
  // Handle content ready state
  const handleContentReady = useCallback(() => {
    console.log('Content ready callback triggered');
    setIsContentReady(true);
  }, []);
  
  // Debug effect to log ref changes
  useEffect(() => {
    console.log('Print content ref updated:', printContentRef.current);
  }, [printContentRef.current]);
  
  // Use the provided examConfig or get it from student.examConfig
  const examConfig = React.useMemo(() => {
    if (externalExamConfig) return externalExamConfig;
    
    if (!student?.examConfig) return null;

    // Get the first exam config (since we're only handling one exam at a time)
    const examName = Object.keys(student.examConfig || {})[0];
    const examData = student.examConfig[examName];

    if (!examData) return null;

    console.log('Processed exam data:', {
      examName,
      subjects: examData.subjects,
      evaluationTypes: examData.evaluationTypes,
      hasFullMarks: !!examData.fullMarks,
      hasSchedule: !!examData.schedule
    });

    return {
      examName,
      subjects: Array.isArray(examData.subjects) ? examData.subjects : [],
      evaluationTypes: Array.isArray(examData.evaluationTypes) 
        ? examData.evaluationTypes 
        : ['Written'],
      fullMarks: examData.fullMarks || {},
      schedule: examData.schedule || {}
    };
  }, [externalExamConfig, student]);
  
  console.log("examConfig in admit card prin preview modal", examConfig);
  
  // Handle content ready state changes
  useEffect(() => {
    console.log('Modal content ready state:', isContentReady);
    if (isContentReady && printButtonRef.current) {
      // Auto-focus the print button when content is ready
      printButtonRef.current.focus();
    }
  }, [isContentReady]);

  const handlePrint = useReactToPrint({
    contentRef:  printContentRef, // MUST be a DOM node, not HTML string
    removeAfterPrint: true,
    documentTitle: `AdmitCard-${student?.roll || 'student'}`,
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
        // Wait until content is ready AND DOM node exists
        if (printContentRef.current) {
          resolve();
          return;
        }

        const interval = setInterval(() => {
          if (isContentReady && printContentRef.current) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    },
    onPrintError: (error) => {
      console.error('Error while printing:', error);
    },
    onAfterPrint: () => {
      console.log('Print completed or cancelled');
      setIsContentReady(false); // Reset ready state for next print
    },
  });

  return ReactDOM.createPortal(
    <div className="modal-overlay" style={styles.overlay}>
      <div className="modal-dialog modal-xl" style={styles.modal}>
        <div className="bg-white rounded-lg shadow-xl flex flex-col w-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h5 className="modal-title m-0">Admit Card Preview</h5>
            <div className="flex gap-8">
              <Button 
                ref={printButtonRef}
                variant="primary" 
                className="d-flex align-items-center"
                onClick={handlePrint}
              >
                <FiPrinter className="me-1" /> 
              </Button>
              <Button 
                variant="outline-secondary" 
                className="flex align-items-center justify-center bg-red-100 rounded-full p-2 "
                onClick={onClose}
              >
                <FiX className="me-1" /> 
              </Button>
            </div>
          </div>
          <div className="p-0 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="w-full">
              <div ref={printContentRef} className="print-content">
                {!student || !examConfig ? (
                  <div className="p-8 text-center">
                    <div className="text-red-500 font-medium mb-2">
                      {!student && 'Student data is missing. '}
                      {!examConfig && 'Exam configuration is missing.'}
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <AdmitPrintPage 
                      student={student}
                      selectedExam={selectedExam}
                      examConfig={{
                        ...examConfig,
                        examName: selectedExam ? selectedExam.name : (examConfig?.examName || 'Exam')
                      }}
                      onContentReady={handleContentReady}
                      isPrintMode={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050,
    padding: '1rem',
    overflowY: 'auto'
  },
  modal: {
    width: '60%',
    maxWidth: '1200px',
    margin: '1.75rem auto',
    position: 'relative',
    zIndex: 1051,
    maxHeight: '95vh',
    display: 'flex',
    flexDirection: 'column'
  },
};

export default AdmitPrintPreviewModal;