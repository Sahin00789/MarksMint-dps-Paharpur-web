import React, { useState, useCallback } from 'react';
import { FiUpload, FiX, FiDownload, FiInfo } from 'react-icons/fi';
import ExcelImportExportModal from '../../common/ExcelImportExportModal';

const CoScholasticImportModal = ({ isOpen, onClose, onImport, selectedClass }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = useCallback(async (importData) => {
    if (!selectedClass) {
      setError('Please select a class');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Pass the raw imported data to the parent component
      // The parent will handle the transformation and API call
      await onImport(importData);
      
      return true;
    } catch (err) {
      console.error('Error importing co-scholastic grades:', err);
      setError(err.message || 'Failed to import co-scholastic grades');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, onImport]);

  const templateData = [{
    'Roll Number': '1',
    'Student Name': 'John Doe',
    'Work Education': 'A',
    'Art Education': 'B+',
    'Health & Physical Education': 'A-',
    'Discipline': 'A',
    'Values': 'B+'
  }];

  const requiredColumns = [
    'Roll Number',
    'Student Name',
    'Work Education',
    'Art Education',
    'Health & Physical Education',
    'Discipline',
    'Values'
  ];

  const instructions = [
    '1. Download and use the template for the correct format',
    '2. Ensure all required columns are present',
    '3. Use standard grade values (A+, A, A-, B+, B, C, D, E, F)',
    '4. Do not change the column headers',
    '5. Keep Student ID and Roll Number consistent with your records'
  ];

  return (
    <ExcelImportExportModal
      isOpen={isOpen}
      onClose={onClose}
      onImport={handleImport}
      title="Import Co-Scholastic Grades"
      templateData={templateData}
      requiredColumns={requiredColumns}
      instructions={instructions}
      isLoading={isLoading}
      error={error}
      fileNameTemplate={`coscholastic_${selectedClass || 'class'}_${new Date().toISOString().split('T')[0]}`}
    />
  );
};

export default CoScholasticImportModal;
