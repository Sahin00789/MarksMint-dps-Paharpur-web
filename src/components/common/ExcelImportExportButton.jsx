import React, { useState } from 'react';
import ExcelImportExportModal from './ExcelImportExportModal';

const ExcelImportExportButton = ({
  data = [],
  onImport,
  onExport,
  children,
  buttonClassName = 'inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
  modalTitle,
  panelType,
  customConfig = {}
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Default button content if no children provided
  const buttonContent = children || (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Excel
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={buttonClassName}
      >
        {buttonContent}
      </button>
      
      <ExcelImportExportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (customConfig.onClose) customConfig.onClose();
        }}
        panelType={panelType}
        data={data}
        onImport={onImport}
        onExport={onExport}
        modalTitle={modalTitle}
        customConfig={customConfig}
      />
    </>
  );
};

export default ExcelImportExportButton;
