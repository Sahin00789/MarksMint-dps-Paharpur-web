import React, { useState, useCallback } from 'react';
import { FiUpload, FiX, FiDownload, FiInfo } from 'react-icons/fi';
import ExcelImportExportModal from '../../common/ExcelImportExportModal';

const AttendanceImportModal = ({ isOpen, onClose, onImport, selectedClass }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = useCallback(async (importData) => {
    if (!selectedClass) {
      setError('Please select a class first');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Transform the data to match your API's expected format
      const attendanceData = importData.map(row => ({
        studentId: row['Student ID'],
        studentName: row['Student Name'],
        rollNumber: row['Roll Number'],
        dates: Object.entries(row)
          .filter(([key]) => key !== 'Student ID' && key !== 'Student Name' && key !== 'Roll Number')
          .reduce((acc, [date, status]) => ({
            ...acc,
            [date]: status === 'P' // P for Present, any other value is considered absent
          }), {})
      }));

      await onImport({
        class: selectedClass,
        attendance: attendanceData
      });
      
      return true;
    } catch (err) {
      console.error('Error importing attendance:', err);
      setError(err.message || 'Failed to import attendance');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, onImport]);

  const templateData = [{
    'Student ID': 'S001',
    'Student Name': 'John Doe',
    'Roll Number': '1',
    '2023-01-01': 'P',
    '2023-01-02': 'A',
    // Add more sample dates as needed
  }];

  const requiredColumns = [
    'Student ID',
    'Student Name',
    'Roll Number'
    // Dates will be dynamic based on the uploaded file
  ];

  const instructions = [
    '1. Download and use the template for the correct format',
    '2. Ensure all required columns are present',
    '3. Use "P" for Present and any other value for Absent',
    '4. Each date column should be in YYYY-MM-DD format',
    '5. Do not change the column headers'
  ];

  return (
    <ExcelImportExportModal
      isOpen={isOpen}
      onClose={onClose}
      onImport={handleImport}
      panelType="attendance"
      title="Import Attendance"
      templateData={templateData}
      requiredColumns={requiredColumns}
      instructions={instructions}
      isLoading={isLoading}
      error={error}
      fileNameTemplate={`attendance_${selectedClass || 'class'}_${new Date().toISOString().split('T')[0]}`}
    />
  );
};

export default AttendanceImportModal;
