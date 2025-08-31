import React, { useRef, forwardRef, useMemo } from 'react';
import { FaPrint } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import PrintLayout from './PrintLayout';

// Create a component that can be forwarded a ref
const PrintContent = forwardRef(({ title, type, children }, ref) => (
  <div ref={ref}>
    <PrintLayout title={title} type={type}>
      {children}
    </PrintLayout>
  </div>
));

// Set display name for better debugging
PrintContent.displayName = 'PrintContent';

const PrintButton = ({ 
  data, 
  title, 
  type = 'student',
  buttonText = 'Print',
  className = ''
}) => {
  const componentRef = useRef();
  
  const contentToPrint = useRef(null);
  
  const handlePrint = useReactToPrint({
    content: () => contentToPrint.current,
    documentTitle: title,
    pageStyle: `
      @page { 
        size: A4 landscape;
        margin: 10mm;
      }
      @media print {
        @page { margin: 0; }
        body { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0;
          padding: 0;
        }
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print, .no-print * { 
          display: none !important; 
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-container {
          padding: 0;
          margin: 0;
          width: 100%;
        }
      }
    `,
    removeAfterPrint: true,
    onBeforeGetContent: () => {
      // Ensure we have content to print
      if (!contentToPrint.current) {
        console.error('No content to print');
        return Promise.reject('No content to print');
      }
      // Force a re-render to ensure content is up to date
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      alert('Failed to generate print preview. Please try again.');
    }
  });
  
  const renderStudentData = () => (
    <table className="print-table w-full">
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Father's Name</th>
          <th>Class</th>
          <th>Section</th>
          <th>Roll No.</th>
          <th>Mobile</th>
          <th>DOB</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        {data.map((student, index) => (
          <tr key={student._id || index}>
            <td>{student.studentName || ''}</td>
            <td>{student.fatherName || ''}</td>
            <td>{student.class || ''}</td>
            <td>{student.section || ''}</td>
            <td>{student.roll || ''}</td>
            <td>{student.mobileNumber || ''}</td>
            <td>{student.dob ? new Date(student.dob).toLocaleDateString() : ''}</td>
            <td>{student.address || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  
  const renderMarksData = () => {
    if (!data || data.length === 0) return <p>No data available</p>;
    
    if (type === 'co-scholastic') {
      // Get all unique grade categories with consistent order
      const gradeCategories = [
        'Work Education',
        'Art Education',
        'Health & Physical Education',
        'Discipline',
        'Values'
      ].filter(category => 
        data.some(student => student.grades && student.grades[category])
      );
      
      // Sort students by roll number
      const sortedStudents = [...data].sort((a, b) => 
        (a.roll || '').localeCompare(b.roll || '')
      );
      
      return (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Co-Scholastic Grades Report</h2>
          <table className="print-table w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Roll No.</th>
                <th className="border p-2">Student Name</th>
                {gradeCategories.map(category => (
                  <th key={category} className="border p-2">{category}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => {
                const grades = student.grades || {};
                return (
                  <tr key={student._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-2 text-center">{student.roll || ''}</td>
                    <td className="border p-2">{student.studentName || ''}</td>
                    {gradeCategories.map(category => {
                      const grade = grades[category];
                      return (
                        <td 
                          key={`${student._id}-${category}`} 
                          className="border p-2 text-center font-medium"
                        >
                          {grade || '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Default marks table
    const subjects = [...new Set(data.flatMap(student => 
      student.marks ? Object.keys(student.marks) : []
    ))];
    
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Marks Report</h2>
        <table className="print-table w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Roll No.</th>
              <th className="border p-2">Student Name</th>
              {subjects.map(subject => (
                <th key={subject} className="border p-2">{subject}</th>
              ))}
              <th className="border p-2">Total</th>
              <th className="border p-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.map((student, index) => {
              const marks = student.marks || {};
              const totalMarks = Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0);
              const percentage = subjects.length > 0 ? (totalMarks / (subjects.length * 100) * 100).toFixed(2) : 0;
              
              return (
                <tr key={student._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{student.roll || ''}</td>
                  <td className="border p-2">{student.studentName || ''}</td>
                  {subjects.map(subject => (
                    <td key={`${student._id}-${subject}`} className="border p-2 text-center">
                      {marks[subject] || 'N/A'}
                    </td>
                  ))}
                  <td className="border p-2 text-center">{totalMarks}</td>
                  <td className="border p-2 text-center">{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Prepare content based on type
  const content = useMemo(() => 
    type === 'student' ? renderStudentData() : renderMarksData(),
    [data, type]
  );
  
  // Set print layout based on type
  const printLayoutProps = useMemo(() => ({
    title: type === 'co-scholastic' 
      ? `${title} - ${new Date().getFullYear()}`
      : title,
    type: type === 'co-scholastic' ? 'co-scholastic' : type
  }), [title, type]);
  
  return (
    <div className={className}>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <FaPrint />
        {buttonText}
      </button>
      
      {/* This will be hidden but accessible to the print function */}
      <div style={{ display: 'none' }}>
        <div ref={contentToPrint} className="print-content">
          <PrintContent 
            ref={componentRef}
            {...printLayoutProps}
          >
            {content}
          </PrintContent>
        </div>
      </div>
    </div>
  );
};

export default PrintButton;
