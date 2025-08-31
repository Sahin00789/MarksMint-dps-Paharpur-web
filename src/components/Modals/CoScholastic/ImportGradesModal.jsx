import React, { useState, useCallback, useRef } from 'react';
import { FiUpload, FiX, FiDownload, FiInfo } from 'react-icons/fi';
import Modal from '../../common/Modal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ImportGradesModal({ isOpen, onClose, onImport, selectedClass }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await readExcelFile(file);
      
      // Validate required columns
      if (!data[0] || !('Roll Number' in data[0])) {
        throw new Error('Missing required column: Roll Number');
      }

      // Get all date columns (all columns except 'Roll Number')
      const dateColumns = Object.keys(data[0]).filter(key => key !== 'Roll Number');
      
      if (dateColumns.length === 0) {
        throw new Error('No grade columns found. Please include at least one date column with grades.');
      }

      // Transform data to match our format
      const transformedData = data.map(row => ({
        rollNumber: row['Roll Number'],
        grades: dateColumns.reduce((acc, date) => ({
          ...acc,
          [date]: row[date] || ''
        }), {})
      }));

      // Call parent's import handler
      await onImport(transformedData);
      setSuccess('Grades imported successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error importing grades:', err);
      setError(err.message || 'Failed to import grades');
    } finally {
      setIsLoading(false);
    }
  }, [onImport]);

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (err) {
          reject(new Error('Invalid Excel file format'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadTemplate = useCallback(() => {
    const templateData = [{
      'Roll Number': '1',
      '2023-09-01': 'A',
      '2023-09-02': 'B+',
      '2023-09-03': 'A-'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Co-Scholastic Grades');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `CoScholastic_Grades_Template_${selectedClass || ''}.xlsx`);
  }, [selectedClass]);

  const instructions = [
    '1. First column must be "Roll Number"',
    '2. Add date columns in YYYY-MM-DD format (e.g., 2023-09-01)',
    '3. Enter grades in each cell (A, B+, C, etc.)',
    '4. Leave cells empty for no grade',
    '5. Each row represents one student'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import Co-Scholastic Grades
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-md">
            <div className="flex items-center">
              <FiCheckCircle className="h-5 w-5 mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer 
                ${isLoading ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  XLSX (Excel) files only
                </p>
              </div>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
          <div className="flex">
            <FiInfo className="flex-shrink-0 h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                File Format Requirements
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>• Ensure your Excel file includes these exact column headers:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Roll Number</li>
                  <li>Student Name</li>
                  <li>Work Education</li>
                  <li>Art Education</li>
                  <li>Health & Physical Education</li>
                  <li>Discipline</li>
                  <li>Values</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
            disabled={isLoading}
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Download Template
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Grades'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
