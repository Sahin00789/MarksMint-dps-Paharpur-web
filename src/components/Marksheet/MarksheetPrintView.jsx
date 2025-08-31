 import React from 'react';
import { format } from 'date-fns';

const MarksheetPrintView = React.forwardRef(({ 
  studentInfo, 
  examResults = [], 
  academicYear,
  schoolInfo,
  generatedOn
}, ref) => {
  if (!studentInfo || !schoolInfo) return null;

  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Determine grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A1';
    if (percentage >= 80) return 'A2';
    if (percentage >= 70) return 'B1';
    if (percentage >= 60) return 'B2';
    if (percentage >= 50) return 'C1';
    if (percentage >= 40) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E (Needs Improvement)';
  };

  // Calculate overall performance
  const overallPerformance = examResults.reduce((acc, exam) => {
    acc.totalMarks += exam.totalMarks || 0;
    acc.maxTotalMarks += exam.maxTotalMarks || 0;
    return acc;
  }, { totalMarks: 0, maxTotalMarks: 0 });

  const overallPercentage = overallPerformance.maxTotalMarks > 0 
    ? (overallPerformance.totalMarks / overallPerformance.maxTotalMarks * 100).toFixed(2)
    : 0;

  return (
    <div 
      ref={ref} 
      className="bg-white text-gray-800 p-8 print:p-0 w-[210mm] min-h-[297mm] mx-auto print:mx-0 print:shadow-none shadow-lg print:bg-white"
      style={{
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid',
      }}
    >
      {/* Header Section */}
      <header className="text-center mb-6 border-b-2 border-gray-800 pb-4">
        <h1 className="text-2xl font-bold uppercase">{schoolInfo.name}</h1>
        <p className="text-sm">{schoolInfo.address}</p>
        <p className="text-sm">Phone: {schoolInfo.phone} | Email: {schoolInfo.email}</p>
        <h2 className="text-xl font-bold mt-2">DETAILED REPORT CARD</h2>
        <p className="text-sm">Academic Year: {academicYear}</p>
      </header>

      {/* Student Info Section */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><span className="font-semibold">Name:</span> {studentInfo.name}</p>
          <p><span className="font-semibold">Father's Name:</span> {studentInfo.fatherName || 'N/A'}</p>
          <p><span className="font-semibold">Mother's Name:</span> {studentInfo.motherName || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Roll No:</span> {studentInfo.rollNumber}</p>
          <p><span className="font-semibold">Class:</span> {studentInfo.className}</p>
          <p><span className="font-semibold">Section:</span> {studentInfo.section || 'N/A'}</p>
        </div>
      </div>

      {/* Exam Results */}
      {examResults.map((exam, examIndex) => (
        <div key={examIndex} className="mb-8">
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
            {exam.examName} - {exam.examDate && formatDate(exam.examDate)}
          </h3>
          
          {/* Subjects Table */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-800 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-2 w-1/12">S.No</th>
                  <th className="border border-gray-800 p-2 text-left">Subject</th>
                  <th className="border border-gray-800 p-2 w-1/6">Max Marks</th>
                  <th className="border border-gray-800 p-2 w-1/6">Marks Obtained</th>
                  <th className="border border-gray-800 p-2 w-1/6">Grade</th>
                </tr>
              </thead>
              <tbody>
                {exam.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-1 text-center">{index + 1}</td>
                    <td className="border border-gray-400 p-1">{subject.name}</td>
                    <td className="border border-gray-400 p-1 text-center">{subject.maxMarks}</td>
                    <td className="border border-gray-400 p-1 text-center">{subject.obtainedMarks || '-'}</td>
                    <td className="border border-gray-400 p-1 text-center">
                      {subject.grade || getGrade((subject.obtainedMarks / subject.maxMarks) * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="2" className="border border-gray-400 p-1 text-right">Total:</td>
                  <td className="border border-gray-400 p-1 text-center">{exam.maxTotalMarks}</td>
                  <td className="border border-gray-400 p-1 text-center">{exam.totalMarks}</td>
                  <td className="border border-gray-400 p-1 text-center">{exam.grade || getGrade(exam.percentage)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Exam Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="border border-gray-800 p-2">
              <p className="font-semibold">Percentage:</p>
              <p className="text-center">{exam.percentage}%</p>
            </div>
            <div className="border border-gray-800 p-2">
              <p className="font-semibold">Grade:</p>
              <p className="text-center">{exam.grade || getGrade(exam.percentage)}</p>
            </div>
            <div className="border border-gray-800 p-2">
              <p className="font-semibold">Rank in Class:</p>
              <p className="text-center">{exam.rank || 'N/A'}</p>
            </div>
          </div>

          {/* Remarks */}
          {exam.remarks && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-1">Remarks:</h4>
              <p className="text-sm pl-2">{exam.remarks}</p>
            </div>
          )}
        </div>
      ))}

      {/* Overall Performance */}
      {examResults.length > 1 && (
        <div className="mt-6 pt-4 border-t-2 border-gray-800">
          <h3 className="text-lg font-semibold mb-3">Overall Performance</h3>
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="border border-gray-800 p-2">
              <p className="font-semibold">Total Marks:</p>
              <p className="text-center">{overallPerformance.totalMarks} / {overallPerformance.maxTotalMarks}</p>
            </div>
            <div className="border border-gray-800 p-2">
              <p className="font-semibold">Overall Percentage:</p>
              <p className="text-center">{overallPercentage}%</p>
            </div>
            <div className="border border-gray-800 p-2">
              <p className="font-semibold">Overall Grade:</p>
              <p className="text-center">{getGrade(overallPercentage)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="grid grid-cols-3 gap-4 mt-12 text-sm">
        <div className="text-center">
          <div className="h-16 border-t border-gray-800 pt-2">
            <p className="font-semibold">Class Teacher</p>
            <p className="text-xs mt-1">{schoolInfo.classTeacher || '________________'}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="h-16 border-t border-gray-800 pt-2">
            <p className="font-semibold">Principal</p>
            <p className="text-xs mt-1">{schoolInfo.principal || '________________'}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="h-16 border-t border-gray-800 pt-2">
            <p className="font-semibold">Date</p>
            <p className="text-xs mt-1">{generatedOn ? formatDate(generatedOn) : formatDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
});

MarksheetPrintView.displayName = 'MarksheetPrintView';

export default MarksheetPrintView;
