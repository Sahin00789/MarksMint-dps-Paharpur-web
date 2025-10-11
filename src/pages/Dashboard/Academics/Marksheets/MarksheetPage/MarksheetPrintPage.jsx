import React, { useEffect, useRef, useState, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaUser, FaQrcode, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import QRCode from 'qrcode-svg';
import { schoolinfo } from '@/shared/schoolInformation';
import { formatDate } from '@/utils/dateUtils';

// Co-scholastic subjects and their labels
const CO_SCHOLASTIC_SUBJECTS = [
  { key: 'workEducation', label: 'Work Education' },
  { key: 'artEducation', label: 'Art Education' },
  { key: 'healthAndPhysical', label: 'Health & Physical Education' },
  { key: 'discipline', label: 'Discipline' }
];

// Grading scale for co-scholastic subjects
const GRADE_SCALE = [
  { range: [91, 100], grade: 'A1', description: 'Outstanding' },
  { range: [81, 90], grade: 'A2', description: 'Excellent' },
  { range: [71, 80], grade: 'B1', description: 'Good' },
  { range: [61, 70], grade: 'B2', description: 'Very Good' },
  { range: [51, 60], grade: 'C1', description: 'Fair' },
  { range: [41, 50], grade: 'C2', description: 'Average' },
  { range: [33, 40], grade: 'D', description: 'Below Average' },
  { range: [0, 32], grade: 'E', description: 'Needs Improvement' }
];

// Add Google Fonts
const googleFontsLink = document.createElement('link');
const bengaliFontLink = document.createElement('link');

// Main fonts (English)
googleFontsLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;600;700&display=swap';
googleFontsLink.rel = 'stylesheet';

// Bengali (Bangla) font - Using Baloo Da 2 for better readability
bengaliFontLink.href = 'https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap';
bengaliFontLink.rel = 'stylesheet';

document.head.appendChild(googleFontsLink);
document.head.appendChild(bengaliFontLink);

const printStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
  
  /* Enhanced Bengali typography */
  .bengali-text {
    font-family: 'Baloo Da 2', 'Noto Sans Bengali', 'Hind Siliguri', 'Poppins', sans-serif;
    line-height: 1.7;
    letter-spacing: 0.3px;
    word-spacing: 1px;
  }
  
  .bengali-heading {
    font-family: 'Baloo Da 2', 'Noto Sans Bengali', sans-serif;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0.5px;
  }

  @media print {
    @page {
      size: A4;
      margin: 10mm 5mm 15mm 5mm;
    }
    
    html, body {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
      font-family: 'Poppins', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Poppins', sans-serif;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Roboto Slab', serif;
    }
    
    .no-print {
      display: none !important;
    }
    
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    img, svg {
      max-width: 100% !important;
      max-height: 100% !important;
    }
    
    /* Ensure tables don't break across pages */
    table {
      page-break-inside: auto;
    }
    
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    /* Force a page break after the marksheet */
    .marksheet-container {
      page-break-after: always;
    }
    
    /* Last page should not have a page break after */
    .marksheet-container:last-child {
      page-break-after: auto;
    }
  }
`;

// Common styles
const containerStyle = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  padding: '10mm',
  backgroundColor: '#fff',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  position: 'relative',
  boxSizing: 'border-box',
  overflow: 'hidden',
  fontFamily: '"Poppins", "Arial", sans-serif'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  paddingBottom: '10px',
  borderBottom: '2px solid #1e40af'
};

const schoolNameStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1e40af',
  margin: '5px 0'
};

const titleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '15px 0',
  color: '#1e293b',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const studentInfoStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '20px',
  margin: '20px 0',
  padding: '15px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  borderLeft: '4px solid #1e40af'
};

const infoItemStyle = {
  flex: '1 1 200px',
  margin: '5px 0'
};

const labelStyle = {
  fontWeight: '600',
  color: '#475569',
  marginRight: '5px',
  fontSize: '14px'
};

const valueStyle = {
  color: '#1e293b',
  fontSize: '14px'
};

const tableContainerStyle = {
  width: '100%',
  overflowX: 'auto',
  margin: '20px 0',
  fontSize: '13px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  backgroundColor: '#fff',
  borderRadius: '8px',
  overflow: 'hidden'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '20px 0',
  fontSize: '13px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  backgroundColor: '#fff',
  borderRadius: '8px',
  overflow: 'hidden'
};

const thStyle = {
  backgroundColor: '#f3f4f6',
  color: '#1e40af',
  fontWeight: '600',
  padding: '12px',
  textAlign: 'left',
  border: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  fontSize: '12px',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '12px',
  border: '1px solid #e5e7eb',
  verticalAlign: 'middle',
  backgroundColor: '#fff',
  color: '#374151',
  fontSize: '13px',
  lineHeight: '1.5'
};

const evenRowStyle = {
  ...tdStyle,
  backgroundColor: '#f9fafb'
};

const gradeBadgeStyle = (grade) => ({
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '12px',
  fontWeight: '600',
  fontSize: '12px',
  backgroundColor: grade === 'F' ? '#fee2e2' : '#e0f2fe',
  color: grade === 'F' ? '#b91c1c' : '#0369a1',
  textAlign: 'center',
  minWidth: '40px'
});

const footerStyle = {
  marginTop: '30px',
  paddingTop: '15px',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '20px'
};

const signBoxStyle = {
  textAlign: 'center',
  marginTop: '40px',
  flex: '1',
  minWidth: '120px'
};

const signLineStyle = {
  borderTop: '1px solid #000',
  width: '80%',
  margin: '0 auto 5px',
  paddingTop: '25px'
};

const signTextStyle = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0'
};

const actionButtonsStyle = {
  margin: '20px 0',
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontWeight: '500',
  transition: 'all 0.2s',
  backgroundColor: '#1e40af',
  color: 'white',
  '&:hover': {
    backgroundColor: '#1e3a8a'
  }
};

const MarksheetPrintPage = ({
  student = {}, 
  examResults = [], 
  coScholastic = {},
  attendanceConfig = {},
  academicYear = String(new Date().getFullYear() + 1),
  school = {}
}) => {
  // Convert examResults to array if it's an object
  const normalizedExamResults = Array.isArray(examResults) 
    ? examResults 
    : Object.entries(examResults).map(([key, value]) => ({
        ...value,
        subject: key,
        subjectName: value.subjectName || key
      }));
  const navigate = useNavigate();
  const printRef = useRef();
  const qrContainerRef = useRef(null);
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  
  // Ensure student data exists
  const studentData = student || {};
  
  // School information
  const schoolInfo = {
    name: schoolinfo?.name || 'SCHOOL NAME',
    branch: schoolinfo?.branch || '',
    address: schoolinfo?.address || 'School Address, City, State, Pincode',
    regNumber: schoolinfo?.regNumber || '',
    runBy: schoolinfo?.runBy || 'M.M.D.C.T.',
    estd: schoolinfo?.estd || '',
    contact: schoolinfo?.contact || '+91-XXXXXXXXXX',
    email: schoolinfo?.email || 'info@school.edu'
  };
  
  // Generate QR code with student and exam info
  useEffect(() => {
    if (!student || !qrContainerRef.current) return;
    
    try {
      const qrData = JSON.stringify({
        name: student.studentName || student.name || '',
        roll: student.rollNumber || '',
        class: student.Class || '',
        admissionNo: student.admissionNo || ''
      });
      
      // Clear previous QR code
      qrContainerRef.current.innerHTML = '';
      
      // Generate and render QR code
      const qr = new QRCode({
        content: qrData,
        padding: 1,
        width: 100,
        height: 100,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M'
      });
      
      // Set the QR code SVG to the container
      qrContainerRef.current.innerHTML = qr.svg();
      setQrCodeSvg(qr.svg());
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [student]);
  
  // Calculate total and percentage
  const totalMarks = Array.isArray(examResults) ? 
    examResults.reduce((sum, result) => sum + (parseFloat(result.obtainedMarks) || 0), 0) : 0;
    
  const maxMarks = Array.isArray(examResults) ? 
    examResults.reduce((sum, result) => sum + (parseFloat(result.maxMarks) || 0), 0) : 0;
    
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  
  // Get grade from percentage
  const getGrade = (percentage) => {
    if (percentage === undefined || percentage === null) return 'N/A';
    const gradeObj = GRADE_SCALE.find(
      ({ range }) => percentage >= range[0] && percentage <= range[1]
    );
    return gradeObj ? gradeObj.grade : 'N/A';
  };
  
  // Helper function to generate remarks based on percentage
  const getRemarks = (percentage) => {
    if (percentage >= 90) {
      return 'Excellent performance! Keep up the good work and continue to challenge yourself.';
    } else if (percentage >= 75) {
      return 'Very good performance. With a little more effort, you can achieve even better results.';
    } else if (percentage >= 50) {
      return 'Satisfactory performance. Focus on your weak areas to improve your grades.';
    } else {
      return 'Needs improvement. Please work harder and seek help from your teachers if needed.';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    // Auto-print if specified in URL
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('print') === 'true') {
      setTimeout(() => {
        window.print();
      }, 1000); // Increased timeout to ensure all data is loaded
    }
  }, [location.search, studentData]);
console.log("student data in marksheet print page", student);

  if (!studentData || Object.keys(studentData).length === 0) {
    console.error('No student data available:', { student, location });
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h3 style={{
            marginBottom: '1rem',
            color: '#dc3545',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            No Student Data Available
          </h3>
          <p style={{
            marginBottom: '1.5rem',
            color: '#6c757d'
          }}>
            The requested student data could not be loaded. Please check the student ID and try again.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              ...buttonStyle,
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': {
                backgroundColor: '#5a6268'
              }
            }}
          >
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Generate QR code with student and exam info
  useEffect(() => {
    if (!student || !qrContainerRef.current) return;
    
    try {
      const qrData = JSON.stringify({
        name: student.studentName || student.name || '',
        roll: student.rollNumber || '',
        class: student.Class || '',
        admissionNo: student.admissionNo || ''
      });
      
      // Clear previous QR code
      qrContainerRef.current.innerHTML = '';
      
      // Generate and render QR code
      const qr = new QRCode({
        content: qrData,
        padding: 1,
        width: 100,
        height: 100,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M'
      });
      
      // Set the QR code SVG to the container
      qrContainerRef.current.innerHTML = qr.svg();
      setQrCodeSvg(qr.svg());
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [student]);

  return (
    <div className="print-page" style={{
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '6px',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
      backgroundSize: '300% 300%',
      animation: 'gradient 8s ease infinite',
      borderRadius: '8px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @media print {
            .print-page {
              padding: 0 !important;
              background: none !important;
              border: none !important;
            }
          }
        `}
      </style>
    

      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        padding: '9mm',
        boxSizing: 'border-box',
        borderRadius: '4px',
        fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: '1.5',
        color: '#1f2937',
        fontSize: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <div ref={printRef} style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          boxSizing: 'border-box',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          zIndex: 2
        }}>
        {/* Report Card Title */}
   
        {/* Main Content Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: '1 1 auto',
          overflow: 'hidden',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}>
          {/* School Info Card */}
          <div style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: '8px 12px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
            boxSizing: 'border-box'
          }}>
          {/* School Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {/* School Name */}
            <div style={{
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                marginBottom: '0.25rem',
                textAlign: 'center'
              }}>
              <h1 style={{
                fontSize: '24px',
                color: '#1e40af',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                display: 'block',
                textAlign: 'center',
                position: 'relative',
                lineHeight: '1.2'
              }}>
                  {schoolInfo.name}
                  {schoolInfo.branch && (
                    <span style={{
                      marginLeft: '12px',
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 12px',
                      borderRadius: '20px',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      lineHeight: 1.4
                    }}>
                      {schoolInfo.branch}
                    </span>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
                    borderRadius: '3px'
                  }}></div>
                </h1>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '6px 12px',
              margin: '4px 0',
              fontSize: '11px',
              color: '#4b5563',
              lineHeight: '1.2'
            }}>
              {schoolInfo.regNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Reg. No:</span>
                  <span>{schoolInfo.regNumber}</span>
                </div>
              )}
              {schoolInfo.estd && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Established:</span>
                  <span>{schoolInfo.estd}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontWeight: '500' }}>Run by:</span>
                <span>{schoolInfo.runBy}</span>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: '#4b5563',
              fontSize: '11px',
              margin: '2px 0',
              flexWrap: 'wrap',
              textAlign: 'center'
            }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{schoolInfo.address}</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'white',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          padding: '4px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0'
        }}>
          <div 
            ref={qrContainerRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          ></div>
        </div>
        <div style={{
          fontSize: '10px',
          color: '#4b5563',
          textAlign: 'center',
          maxWidth: '100px',
          lineHeight: '1.2'
        }}>
          Scan to verify
        </div>
      </div>
      
      {/* Report Card Header */}
      <div style={{
          textAlign: 'center',
          margin: '0 0 1.5rem 0',
          padding: '0.5rem 1rem',
          color: '#1e293b',
          borderRadius: '0.5rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
        <h2 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span>REPORT CARD</span>
          <span style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#4b5563',
            backgroundColor: '#ffffff',
            padding: '3px 10px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid #e2e8f0'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {academicYear || student.session || String(new Date().getFullYear() + 1)}
          </span>
        </h2>
      </div>

      <div>
        {/* Student Info with Photo - Optimized Layout */}
        <div style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '15px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          borderLeft: '4px solid #1e40af',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}>
        {/* Student Photo - Made more compact */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: '0 0 80px',
          position: 'relative'
        }}>
          <div style={{
            width: '80px',
            height: '100px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {student.photoUrl ? (
              <>
                <img 
                  src={student.photoUrl}
                  alt={student.studentName || 'Student'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'relative',
                    zIndex: 1
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const fallback = document.getElementById(`photo-fallback-${student._id}`);
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  id={`photo-fallback-${student._id}`}
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f1f5f9',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    textAlign: 'center',
                    fontSize: '12px',
                    zIndex: 2
                  }}
                >
                  <FaUser size={28} style={{ marginBottom: '6px' }} />
                  {student.studentName ? student.studentName.charAt(0).toUpperCase() : 'N'}
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                textAlign: 'center',
                fontSize: '12px'
              }}>
                <FaUser size={28} style={{ marginBottom: '6px' }} />
                {student.studentName ? student.studentName.charAt(0).toUpperCase() : 'N'}
              </div>
            )}
          </div>
        </div>
        
        {/* Student Details - Optimized Grid Layout */}
        <div style={{
          flex: '1',
          minWidth: '0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px 10px',
          alignContent: 'flex-start',
          fontSize: '13px'
        }}>
            {/* Column 1 */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '1px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>Student Name</div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#1e293b',
                padding: '6px 8px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {student.studentName || student.name || 'N/A'}
              </div>
            </div>
            
            {/* Column 2 */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '1px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>Father's Name</div>
              <div style={{
                fontSize: '13px',
                color: '#1e293b',
                padding: '6px 8px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {student.fatherName || 'N/A'}
              </div>
            </div>
            
            {/* Column 3 - Date of Birth */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '1px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>Date of Birth</div>
              <div style={{
                fontSize: '13px',
                color: '#1e293b',
                padding: '6px 8px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}>
                {student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'}
              </div>
            </div>
            
            {/* Row 2 - Class, Roll Number, and Address in one row */}
            <div style={{ gridColumn: '1 / 2' }}>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '2px',
                fontWeight: '500'
              }}>Class</div>
              <div style={{
                fontSize: '14px',
                color: '#1e293b',
                padding: '8px 12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {student.Class || 'N/A'}
              </div>
            </div>
            
            {/* Roll Number */}
            <div style={{ gridColumn: '2 / 3' }}>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '2px',
                fontWeight: '500'
              }}>Roll Number</div>
              <div style={{
                fontSize: '14px',
                color: '#1e293b',
                padding: '8px 12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: '600'
              }}>
                {student.rollNumber || student.rollNo || 'N/A'}
              </div>
            </div>
            
            {/* Address */}
            <div style={{ gridColumn: '3 / 4' }}>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '2px',
                fontWeight: '500'
              }}>Address</div>
              <div style={{
                fontSize: '14px',
                color: '#1e293b',
                padding: '8px 12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {student.address || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Scholastic Area */}
        <div style={{
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '16px',
            color: '#1e40af',
            marginBottom: '15px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Scholastic Area</h3>
          
          <div style={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginBottom: '20px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              backgroundColor: '#fff'
            }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '150px'
                  }}>Subject</th>
                  
                  {examResults.length > 0 && examResults[0].evaluations ? (
                    examResults[0].evaluations.map((evalItem, idx) => (
                      <th key={idx} style={{
                        padding: '12px',
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0',
                        fontWeight: '600',
                        color: '#1e293b',
                        whiteSpace: 'nowrap'
                      }}>
                        {evalItem.type}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                          fontSize: '11px',
                          fontWeight: 'normal'
                        }}>
                          <span style={{ flex: 1, textAlign: 'center' }}>M.O.</span>
                          <span style={{ flex: 1, textAlign: 'center' }}>F.M.</span>
                        </div>
                      </th>
                    ))
                  ) : (
                    <th style={{
                      padding: '12px',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      borderBottom: '2px solid #e2e8f0',
                      fontWeight: '600',
                      color: '#1e293b',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>Marks</div>
                      <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 'normal'
                      }}>(Max: {examResults[0]?.maxMarks || 100})</div>
                    </th>
                  )}
                  
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '80px'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>Total</div>
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: 'normal'
                    }}>(Max: {maxMarks})</div>
                  </th>
                  
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '80px'
                  }}>Grade</th>
                </tr>
              </thead>
              
              <tbody>
                {normalizedExamResults.map((subject, index) => {
                  const subjectTotal = subject.evaluations ? 
                    subject.evaluations.reduce((sum, evalItem) => sum + (parseFloat(evalItem.obtainedMarks) || 0), 0) :
                    parseFloat(subject.obtainedMarks) || 0;
                  
                  const subjectMaxMarks = subject.evaluations ?
                    subject.evaluations.reduce((sum, evalItem) => sum + (parseFloat(evalItem.maxMarks) || 0), 0) :
                    parseFloat(subject.maxMarks) || 100;
                  
                  const subjectPercentage = subjectMaxMarks > 0 ? (subjectTotal / subjectMaxMarks) * 100 : 0;
                  const grade = getGrade(subjectPercentage);
                  
                  return (
                    <tr 
                      key={index} 
                      style={{
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                        '&:hover': {
                          backgroundColor: '#f1f5f9'
                        }
                      }}
                    >
                      <td style={{
                        padding: '12px',
                        fontWeight: '500',
                        color: '#1e293b',
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap'
                      }}>{subject.subject || `Subject ${index + 1}`}</td>
                      
                      {subject.evaluations ? (
                        subject.evaluations.map((evalItem, idx) => (
                          <td 
                            key={idx} 
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                              borderBottom: '1px solid #f1f5f9',
                              color: evalItem.obtainedMarks !== undefined ? '#1e293b' : '#94a3b8',
                              fontWeight: evalItem.obtainedMarks !== undefined ? '500' : 'normal',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {evalItem.obtainedMarks !== undefined ? evalItem.obtainedMarks : '-'}
                          </td>
                        ))
                      ) : (
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #f1f5f9',
                          color: subject.obtainedMarks !== undefined ? '#1e293b' : '#94a3b8',
                          fontWeight: subject.obtainedMarks !== undefined ? '500' : 'normal',
                          whiteSpace: 'nowrap'
                        }}>
                          {subject.obtainedMarks !== undefined ? subject.obtainedMarks : '-'}
                        </td>
                      )}
                      
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        fontWeight: '600',
                        color: '#1e293b',
                        whiteSpace: 'nowrap'
                      }}>
                        {subjectTotal.toFixed(2)}
                      </td>
                      
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '9999px',
                          backgroundColor: {
                            'A1': '#d1fae5',
                            'A2': '#dcfce7',
                            'B1': '#f0fdf4',
                            'B2': '#f0fdf4',
                            'C1': '#fef9c3',
                            'C2': '#fef9c3',
                            'D': '#fee2e2',
                            'E': '#fee2e2'
                          }[grade] || '#f1f5f9',
                          color: {
                            'A1': '#065f46',
                            'A2': '#166534',
                            'B1': '#166534',
                            'B2': '#166534',
                            'C1': '#854d0e',
                            'C2': '#854d0e',
                            'D': '#991b1b',
                            'E': '#991b1b'
                          }[grade] || '#1e293b'
                        }}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total Row */}
                <tr style={{
                  backgroundColor: '#f1f5ff',
                  fontWeight: '600',
                  borderTop: '2px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <td style={{
                    padding: '12px',
                    color: '#1e40af',
                    whiteSpace: 'nowrap'
                  }}>Total</td>
                  
                  {examResults.length > 0 && examResults[0].evaluations && (
                    examResults[0].evaluations.map((_, idx) => {
                      const evalTotal = examResults.reduce((sum, subject) => {
                        const evalItem = subject.evaluations?.[idx];
                        return sum + (evalItem ? (parseFloat(evalItem.obtainedMarks) || 0) : 0);
                      }, 0);
                      
                      const evalMax = examResults.reduce((sum, subject) => {
                        const evalItem = subject.evaluations?.[idx];
                        return sum + (evalItem ? (parseFloat(evalItem.maxMarks) || 0) : 0);
                      }, 0);
                      
                      return (
                        <td 
                          key={`total-${idx}`} 
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <div style={{
                            fontWeight: '600',
                            color: '#1e40af'
                          }}>
                            {evalTotal.toFixed(2)}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#64748b',
                            fontWeight: 'normal'
                          }}>
                            ({evalMax})
                          </div>
                        </td>
                      );
                    })
                  )}
                  
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#1e40af'
                    }}>
                      {totalMarks.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: 'normal'
                    }}>
                      ({maxMarks})
                    </div>
                  </td>
                  
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af'
                    }}>
                      {getGrade(percentage)}
                    </span>
                  </td>
                </tr>
                
                {/* Percentage Row */}
                <tr style={{
                  backgroundColor: '#eff6ff',
                  fontWeight: '600',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <td 
                    colSpan={(examResults[0]?.evaluations?.length || 1) + 1} 
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      color: '#1e40af',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Percentage:
                  </td>
                  
                  <td 
                    colSpan="2" 
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#1e40af',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {percentage.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Co-Scholastic Area */}
        <div style={{
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '15px',
            color: '#1e40af',
            marginBottom: '12px',
            paddingBottom: '6px',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaStar size={14} />
            Co-Scholastic Areas
          </h3>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center'
          }}>
            {CO_SCHOLASTIC_SUBJECTS.map((subject, index) => {
              const grade = coScholastic[subject.key] || student[subject.key] || 'N/A';
              const gradeInfo = GRADE_SCALE.find(g => g.grade === grade) || {};
              
              return (
                <div 
                  key={index} 
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <span style={{
                    color: '#4b5563',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    {subject.label}:
                  </span>
                  <span style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    minWidth: '24px',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remarks */}
        <div style={{
          marginBottom: '30px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '10px'
            }}>Class Teacher's Remarks:</h4>
            
            <div style={{
              minHeight: '80px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#334155'
            }}>
              {getRemarks(percentage)}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px dashed #e2e8f0'
          }}>
            <div style={{
              textAlign: 'center',
              flex: '1',
              maxWidth: '200px'
            }}>
              <div style={{
                height: '1px',
                backgroundColor: '#94a3b8',
                marginBottom: '8px',
                position: 'relative'
              }}>
                <div style={{
                  content: '""',
                  position: 'absolute',
                  bottom: '-4px',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: '#94a3b8'
                }} />
              </div>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#475569',
                fontWeight: '500'
              }}>Class Teacher</p>
            </div>
            
            <div style={{
              textAlign: 'center',
              flex: '1',
              maxWidth: '200px'
            }}>
              <div style={{
                height: '1px',
                backgroundColor: '#94a3b8',
                marginBottom: '8px',
                position: 'relative'
              }}>
                <div style={{
                  content: '""',
                  position: 'absolute',
                  bottom: '-4px',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: '#94a3b8'
                }} />
              </div>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#475569',
                fontWeight: '500'
              }}>Principal</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetPrintPage;
