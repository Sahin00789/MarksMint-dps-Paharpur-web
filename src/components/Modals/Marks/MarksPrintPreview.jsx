import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { FaPrint, FaTimes, FaDownload } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import Modal from '../../common/Modal';
import { schoolinfo } from '../../../shared/schoolInformation';

const MarksPrintPreview = forwardRef(({ 
  isOpen, 
  onClose, 
  data, 
  title, 
  className = '',
  session = '2024-2025'
}, ref) => {
  const printRef = useRef();
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: title || 'Marks Report',
    removeAfterPrint: true,
    onBeforeGetContent: () => {
      // Ensure we have content to print
      if (!printRef.current) {
        console.error('No content to print');
        return Promise.reject('No content to print');
      }
      return Promise.resolve();
    },
    pageStyle: `
      @page { 
        size: A4 landscape;
        margin: 15mm 10mm;
      }
      body { 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .print-content {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .print-header {
        text-align: center;
        margin-bottom: 20px;
      }
      .print-header h1 {
        margin: 0;
        font-size: 24px;
        color: #000;
      }
      .print-header p {
        margin: 5px 0 0;
        font-size: 14px;
        color: #666;
      }
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      .print-table th, 
      .print-table td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }
      .print-table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      .print-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, 
        .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 0 20px;
        }
        .no-print, 
        .no-print * { 
          display: none !important; 
        }
        button {
          display: none !important;
        }
      }
    `,
  });

  const handleDownload = () => {
    handlePrint();
  };

  useImperativeHandle(ref, () => ({
    print: handlePrint,
    download: handleDownload
  }));

  if (!isOpen) return null;

  // Get all unique subjects
  const subjects = Array.from(
    new Set(
      data.flatMap(student => (student.marks ? Object.keys(student.marks) : []))
    )
  );

  const renderMarksTable = () => {
    if (!data || data.length === 0) {
      return <p className="text-center py-4">No marks data available</p>;
    }
    
    // Calculate rank for each student based on total marks
    const studentsWithRank = [...data]
      .map(student => {
        const marks = student.marks || {};
        const totalMarks = Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0);
        return { ...student, totalMarks };
      })
      .sort((a, b) => b.totalMarks - a.totalMarks)
      .map((student, index) => ({ ...student, rank: index + 1 }));

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border">Rank</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border">Roll No.</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border">Student Name</th>
              {subjects.map(subject => (
                <th key={subject} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border">
                  {subject}
                </th>
              ))}
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border">Total</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border">%</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {studentsWithRank.map((student, index) => {
              const marks = student.marks || {};
              const totalMarks = student.totalMarks;
              const percentage = subjects.length > 0 
                ? ((totalMarks / (subjects.length * 100)) * 100).toFixed(2) 
                : 0;
              return (
                <tr key={student._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-center text-sm border">
                    {student.rank}
                  </td>
                  <td className="px-3 py-2 text-center text-sm border">
                    {student.roll || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm border">
                    {student.studentName || '-'}
                  </td>
                  {subjects.map(subject => (
                    <td key={`${student._id}-${subject}`} className="px-3 py-2 text-center text-sm border">
                      {marks[subject] || 'N/A'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-sm font-semibold border">
                    {totalMarks}
                  </td>
                  <td className="px-3 py-2 text-center text-sm font-semibold border">
                    {percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">{title || 'Marks Print Preview'}</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPrint className="mr-2 h-4 w-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaTimes className="mr-2 h-4 w-4" />
              Close
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div ref={printRef} className="print-content" style={{ display: 'block' }}>
            {/* School Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h1 className="text-2xl font-bold uppercase">
                    {schoolinfo.name}
                    {schoolinfo.branch && (
                      <span className="ml-2 px-2 py-1 text-sm font-normal bg-blue-100 text-blue-800 rounded-full">
                        {schoolinfo.branch}
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600">{schoolinfo.Address}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="border-t-2 border-b-2 border-gray-300 my-2 py-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{title || 'Marks Report'}</h3>
                  <p className="text-sm">Session: {session}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 flex justify-between mt-1">
                <span>Run by: {schoolinfo.runBy} | Reg. No: {schoolinfo.regNumber}</span>
                <span>Phone: {schoolinfo.mobileNumber} | Email: {schoolinfo.email}</span>
              </div>
            </div>
            
            {/* Student Details */}
            <div className="mb-4">
              {data.length > 0 && (
                <div className="flex justify-between text-sm">
                  <div>
                    <p><span className="font-semibold">Class:</span> {data[0]?.class || 'N/A'}</p>
                    <p><span className="font-semibold">Exam:</span> {title?.split('-')?.[1]?.trim() || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold">Total Students:</span> {data.length}</p>
                    <p><span className="font-semibold">Max Marks:</span> {subjects?.length ? subjects.length * 100 : 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Marks Table */}
            {renderMarksTable()}
            
            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-sm">
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="h-16 border-t border-gray-400 w-32 mx-auto mb – 1"></div>
                  <p>Class Teacher</p>
                </div>
                <div className="text-center">
                  <div className="h-16 border-t border-gray-400 w-32 mx-auto mb – 1"></div>
                  <p>Principal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

MarksPrintPreview.displayName = 'MarksPrintPreview';

export default MarksPrintPreview;
