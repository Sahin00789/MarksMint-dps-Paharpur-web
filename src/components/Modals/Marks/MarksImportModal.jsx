import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { FiUpload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const MarksImportModal = ({ isOpen, onClose, onImport, subjects, selectedClass, selectedExam }) => {
  const [previewData, setPreviewData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapping, setMapping] = useState({});
  const [isMappingComplete, setIsMappingComplete] = useState(false);

  // Initialize mapping when subjects change
  React.useEffect(() => {
    if (subjects?.length) {
      const initialMapping = {};
      subjects.forEach(subject => {
        initialMapping[subject.code] = '';
      });
      setMapping(initialMapping);
    }
  }, [subjects]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError('');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('The file is empty or has no data');
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        
        setPreviewData({
          headers,
          rows: rows.slice(0, 5), // Show first 5 rows for preview
          totalRows: rows.length
        });
        
        // Auto-detect mapping based on headers
        const autoMapping = {};
        subjects?.forEach(subject => {
          const headerIndex = headers.findIndex(h => 
            String(h).toLowerCase().includes(subject.code.toLowerCase()) ||
            String(h).toLowerCase().includes(subject.name.toLowerCase())
          );
          if (headerIndex !== -1) {
            autoMapping[subject.code] = headers[headerIndex];
          }
        });
        setMapping(autoMapping);
        
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setError('Failed to parse the Excel file. Please ensure it is a valid Excel file.');
        setPreviewData(null);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [subjects]);

  const handleMappingChange = (subjectCode, header) => {
    setMapping(prev => ({
      ...prev,
      [subjectCode]: header
    }));
  };

  const handleSubmit = () => {
    if (!previewData) return;
    
    // Validate mapping
    const mappedSubjects = Object.entries(mapping).filter(([_, header]) => header).length;
    if (mappedSubjects === 0) {
      setError('Please map at least one subject');
      return;
    }

    onImport({
      mapping,
      class: selectedClass,
      exam: selectedExam,
      fileName
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Import Marks from Excel
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <FiX size={24} />
            </button>
          </div>

          {!previewData ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <FiUpload className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Drag and drop your Excel file here, or{' '}
                    <label className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 cursor-pointer">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        disabled={isLoading}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Supports .xlsx, .xls, or .csv files
                  </p>
                </div>
              </div>
              {isLoading && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Processing file...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  File: {fileName} ({previewData.totalRows} rows)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-600">
                      <tr>
                        {previewData.headers.map((header, index) => (
                          <th
                            key={index}
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {previewData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {previewData.totalRows > 5 && (
                        <tr>
                          <td 
                            colSpan={previewData.headers.length}
                            className="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            ... and {previewData.totalRows - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Map Excel Columns to Subjects
                </h3>
                
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                          Subject
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Excel Column
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                      {subjects?.map((subject) => (
                        <tr key={subject._id || subject.code}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {subject.name} ({subject.code})
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <select
                              value={mapping[subject.code] || ''}
                              onChange={(e) => handleMappingChange(subject.code, e.target.value)}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                            >
                              <option value="">-- Select Column --</option>
                              {previewData.headers.map((header, index) => (
                                <option key={index} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isMappingComplete}
                  className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    isMappingComplete
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-300 cursor-not-allowed'
                  }`}
                >
                  Import Marks
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksImportModal;
