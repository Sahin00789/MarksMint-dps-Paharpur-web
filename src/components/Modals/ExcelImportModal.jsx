import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { FiUpload, FiFileText, FiCheck, FiAlertCircle } from 'react-icons/fi';

const ExcelImportModal = ({ 
  isOpen, 
  onClose, 
  selectedColumns, 
  onImport, 
  selectedClass 
}) => {
  const [data, setData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    
    // Clear previous data and error
    setError('');
    setPreviewData(null);
    
    // Process the file
    processFile(file);
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setError('The file is empty or has no data');
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
        
        // Filter data based on selected columns
        const columnIndices = selectedColumns.map(col => 
          headers.findIndex(h => h && col && h.toString().toLowerCase() === col.toLowerCase())
        );

        const filteredData = rows.map(row => {
          const obj = {};
          columnIndices.forEach((colIndex, i) => {
            if (colIndex >= 0 && colIndex < row.length) {
              obj[selectedColumns[i]] = row[colIndex];
            } else {
              obj[selectedColumns[i]] = '';
            }
          });
          return obj;
        });

        setPreviewData({
          headers: selectedColumns,
          rows: filteredData
        });
        setData(filteredData);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Invalid file format. Please upload a valid Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    try {
      setIsLoading(true);
      await onImport(previewData);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogContent
          className={cn(
            "w-[90vw] max-w-[800px] h-[85vh] max-h-[800px] transition-all duration-300 ease-in-out transform flex flex-col",
            "bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden",
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          )}
        >
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Import Students
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Upload an Excel file with student data. Supported formats: .xlsx, .xls, .csv
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500',
              'cursor-pointer relative overflow-hidden group',
              'bg-white dark:bg-gray-800/50 backdrop-blur-sm',
              'hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20',
              'transform hover:-translate-y-0.5 transition-transform',
              'flex flex-col items-center justify-center h-full min-h-[200px]'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e);
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
            />
            <div className="space-y-3">
              <div
                className={cn(
                  "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                  isDragging
                    ? 'bg-blue-100 dark:bg-blue-900/30 scale-110'
                    : 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
                  'text-blue-500 dark:text-blue-400',
                  'transform group-hover:scale-105'
                )}
              >
                <FiUpload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Excel or CSV (max 10MB)
                </p>
              </div>
            </div>

            {/* Animated border effect */}
            <div
              className={cn(
                "absolute inset-0 rounded-lg pointer-events-none",
                "border-2 border-transparent",
                isDragging && "animate-pulse border-blue-400"
              )}
            ></div>
          </div>

          {error && (
            <div className="mt-2 p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 flex items-start space-x-2">
              <FiAlertCircle className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {previewData && (
            <div className="mt-4 overflow-hidden border rounded-lg shadow-sm dark:border-gray-700 transition-all duration-300 hover:shadow-md flex-1 flex flex-col">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Preview (first 5 rows)
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <FiCheck className="mr-1 h-3 w-3" />
                    {previewData.rows.length} rows ready
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {previewData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {previewData.headers.map((header, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                          >
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {previewData.rows.length > 5 && (
                      <tr>
                        <td
                          colSpan={previewData.headers.length}
                          className="px-4 py-2 text-xs text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30"
                        >
                          + {previewData.rows.length - 5} more rows not shown
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!previewData || isLoading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              (!previewData || isLoading) && "opacity-70 cursor-not-allowed",
              "transition-colors duration-150 ease-in-out"
            )}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              'Import Students'
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default ExcelImportModal;