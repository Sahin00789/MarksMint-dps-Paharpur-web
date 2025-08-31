import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FiDownload, FiUpload, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { createPortal } from 'react-dom';

// Panel-specific configurations
const PANEL_CONFIGS = {
  students: {
    exportFileName: 'students_export',
    importInstructions: 'Upload an Excel file with student data. Required columns: name, rollNumber, className, section',
    requiredFields: ['name', 'rollNumber', 'className'],
    sampleData: [
      { name: 'John Doe', rollNumber: '1', className: '10', section: 'A', fatherName: 'Mr. Doe', motherName: 'Mrs. Doe', dob: '2010-01-01' },
      { name: 'Jane Smith', rollNumber: '2', className: '10', section: 'A', fatherName: 'Mr. Smith', motherName: 'Mrs. Smith', dob: '2010-02-15' }
    ]
  },
  attendance: {
    exportFileName: 'attendance_export',
    importInstructions: 'Upload an Excel file with attendance data. Required columns: studentId, date, status',
    requiredFields: ['studentId', 'date', 'status'],
    sampleData: [
      { studentId: '1', studentName: 'John Doe', date: '2024-01-01', status: 'present', remarks: '' },
      { studentId: '2', studentName: 'Jane Smith', date: '2024-01-01', status: 'absent', remarks: 'Sick' }
    ]
  },
  'co-scholastic': {
    exportFileName: 'co_scholastic_grades_export',
    importInstructions: 'Upload an Excel file with co-scholastic grades. Required columns: studentId, area, grade',
    requiredFields: ['studentId', 'area', 'grade'],
    sampleData: [
      { studentId: '1', studentName: 'John Doe', area: 'Sports', grade: 'A', remarks: 'Excellent' },
      { studentId: '2', studentName: 'Jane Smith', area: 'Music', grade: 'A+', remarks: 'Outstanding' }
    ]
  },
  marks: {
    exportFileName: 'marks_export',
    importInstructions: 'Upload an Excel file with marks data. Required columns: studentId, subject, marksObtained',
    requiredFields: ['studentId', 'subject', 'marksObtained'],
    sampleData: [
      { studentId: '1', studentName: 'John Doe', subject: 'Mathematics', maxMarks: 100, marksObtained: 85, remarks: 'Good' },
      { studentId: '2', studentName: 'Jane Smith', subject: 'Mathematics', maxMarks: 100, marksObtained: 92, remarks: 'Excellent' }
    ]
  }
};

const ExcelImportExportModal = ({
  isOpen,
  onClose,
  panelType = 'data',
  data = [],
  onImport,
  onExport,
  customConfig = {}
}) => {
  const [activeTab, setActiveTab] = useState('export');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  
  // Get panel-specific configuration
  const config = { ...PANEL_CONFIGS[panelType], ...customConfig };
  
  const handleExport = useCallback(() => {
    try {
      if (!data || data.length === 0) {
        setError('No data available to export');
        return;
      }
      
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `${panelType}_data`);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(blob, `${config.exportFileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccess('Export completed successfully!');
      
      // Call custom export handler if provided
      if (onExport) {
        onExport(data);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data. Please try again.');
    }
  }, [data, panelType, config.exportFileName, onExport]);
  
  const handleImport = async (event) => {
    try {
      setError('');
      setSuccess('');
      
      const file = event.target.files[0];
      if (!file) return;
      
      setIsProcessing(true);
      
      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Validate required fields
      if (config.requiredFields && config.requiredFields.length > 0) {
        const missingFields = config.requiredFields.filter(
          field => !Object.keys(jsonData[0] || {}).includes(field)
        );
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
      }
      
      // Call the provided import handler
      if (onImport) {
        await onImport(jsonData);
      }
      
      setSuccess('Data imported successfully!');
      fileInputRef.current.value = ''; // Reset file input
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.message || 'Failed to import data. Please check the file format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const downloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(config.sampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, `${config.exportFileName}_template.xlsx`);
      setSuccess('Template downloaded successfully!');
    } catch (err) {
      console.error('Failed to download template:', err);
      setError('Failed to download template. Please try again.');
    }
  };
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;
  
  // Get the modal root element
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        overflow: 'auto'
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{
          position: 'relative',
          zIndex: 10000,
          maxWidth: '90%',
          width: '100%',
          margin: '0 auto',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {config.modalTitle || `${panelType.charAt(0).toUpperCase() + panelType.slice(1)} Data`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Import Data
            </button>
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Export {panelType} data to an Excel file. The exported file will include all available data.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Export includes:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {data.length > 0 ? (
                    Object.keys(data[0] || {}).map((key) => (
                      <li key={key} className="ml-4">{key}</li>
                    ))
                  ) : (
                    <li className="ml-4">No data available to export</li>
                  )}
                </ul>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleExport}
                  disabled={!data || data.length === 0 || isProcessing}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    !data || data.length === 0 || isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {config.importInstructions}
                </p>
                {config.requiredFields && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium">Required fields:</span>{' '}
                    {config.requiredFields.join(', ')}
                  </p>
                )}
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600 dark:text-gray-300">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleImport}
                      ref={fileInputRef}
                      disabled={isProcessing}
                    />
                  </label>
                  <p className="pl-1 dark:text-gray-400">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Excel (.xlsx, .xls) up to 10MB
                </p>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Download Excel template
                </button>
              </div>
              
              {config.sampleData && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Sample Data Format:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          {Object.keys(config.sampleData[0] || {}).map((key) => (
                            <th
                              key={key}
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {config.sampleData.slice(0, 2).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((value, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                              >
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default ExcelImportExportModal;
