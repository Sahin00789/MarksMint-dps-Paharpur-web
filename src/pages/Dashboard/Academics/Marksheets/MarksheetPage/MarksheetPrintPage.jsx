import React, { useEffect, useRef, useState, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaUser, FaQrcode, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import QRCode from 'qrcode-svg';
import { formatDate } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { examTermsInTheSchool } from '@/shared/schoolInformation';
import { schoolinfo } from '@/shared/schoolInformation';

// Co-scholastic subjects and their labels
const CO_SCHOLASTIC_SUBJECTS = [
  { key: 'workEducation', label: 'Work Education' },
  { key: 'artEducation', label: 'Art Education' },
  { key: 'healthAndPhysical', label: 'Health & Physical Education' },
  { key: 'discipline', label: 'Discipline' }
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
      margin: 10mm 10mm 15mm 10mm;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Poppins', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: #fff !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Poppins', sans-serif;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    table, th, td, tr {
      border-color: #000 !important;
      -webkit-print-color-adjust: exact;
    }
    .print-container {
      border: 1px solid #000 !important;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Roboto Slab', serif;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-after: always;
    }
    img, svg {
      max-width: 100% !important;
    }
  }
`;

const containerStyle = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  padding: '10mm',
  backgroundColor: '#fff',
  border: '1px solid #000',
  position: 'relative',
  boxSizing: 'border-box',
  overflow: 'hidden',
  fontFamily: '"Poppins", "Arial", sans-serif',
  '@media print': {
    border: 'none',
    padding: 0,
    margin: 0,
    boxShadow: 'none',
    width: '100%',
    height: '100%'
  }
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
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  borderSpacing: 0,
  margin: '0',
  padding: '0',
  tableLayout: 'fixed',
  border: '1px solid #000',
  overflow: 'hidden',
  '@media print': {
    border: '1px solid #000 !important',
    '&, & *': {
      borderColor: '#000 !important',
      color: '#000 !important',
      background: '#fff !important'
    }
  }
};

const thStyle = {
  padding: '8px 12px',
  textAlign: 'center',
  backgroundColor: '#f8fafc',
  border: '1px solid #000',
  borderBottom: '2px solid #000',
  fontWeight: '600',
  color: '#1e293b',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  '@media print': {
    backgroundColor: '#f8f9fa !important',
    borderColor: '#000 !important',
    color: '#000 !important',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact'
  }
};

const tdStyle = {
  padding: '8px 12px',
  border: '1px solid #000',
  verticalAlign: 'middle',
  backgroundColor: '#fff',
  color: '#000',
  fontSize: '13px',
  lineHeight: '1.5',
  textAlign: 'center',
  '@media print': {
    borderColor: '#000 !important',
    color: '#000 !important',
    backgroundColor: '#fff !important',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact'
  }
};

const evenRowStyle = {
  ...tdStyle,
  backgroundColor: '#f8fafc'
};

const headerRowStyle = {
  backgroundColor: '#f1f5f9',
  borderBottom: '2px solid #cbd5e1'
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
  processedStudent = {}, // Single prop containing all required data
  academicYear = '2025'
}) => {
  // Safely destructure coScholastic with default values
  const coScholastic = processedStudent.coScholastic || {
    workEducation: { grade: 'N/A', description: 'Not Available' },
    artEducation: { grade: 'N/A', description: 'Not Available' },
    healthAndPhysical: { grade: 'N/A', description: 'Not Available' },
    discipline: { grade: 'N/A', description: 'Not Available' }
  };
  // Refs
  const printRef = useRef(null);
  const qrContainerRef = useRef(null);
  
  // State
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  // Safely access student data with defaults
  const student = {
    ...(processedStudent?.student || {}),
    // Ensure roll number is properly accessed from any possible property
    rollNo: processedStudent?.student?.rollNo || processedStudent?.rollNo || processedStudent?.student?.roll || 'N/A'
  };
  
  // Get attendance summary with defaults
  const attendanceSummary = {
    totalDays: processedStudent?.attendanceSummary?.totalDays || 0,
    presentDays: processedStudent?.attendanceSummary?.presentDays || 0,
    absentDays: processedStudent?.attendanceSummary?.absentDays || 0,
    attendancePercentage: processedStudent?.attendanceSummary?.attendancePercentage || 0,
    workingDays: processedStudent?.attendanceSummary?.workingDays || 0,
    // Helper functions to handle display
    getPresentDays: function() {
      return this.presentDays > 0 ? this.presentDays : '--';
    },
    getTotalDays: function() {
      return this.totalDays > 0 ? this.totalDays : '--';
    },
    getAttendancePercentage: function() {
      return this.attendancePercentage > 0 ? this.attendancePercentage : 0;
    },
    shouldShowPercentage: function() {
      return this.attendancePercentage > 0;
    }
  };

  // Calculate overall summary if not provided
  const overallSummary = {
    totalMarks: processedStudent?.overallSummary?.totalMarks || 0,
    obtainedMarks: processedStudent?.overallSummary?.obtainedMarks || 0,
    percentage: processedStudent?.overallSummary?.percentage || 0,
    grade: processedStudent?.overallSummary?.grade || 'N/A',
    rank: processedStudent?.overallSummary?.rank || 0,
    totalStudents: processedStudent?.overallSummary?.totalStudents || 1,
    resultStatus: processedStudent?.overallSummary?.resultStatus || 'Pass'
  };

  // Generate QR code with student and exam info
  useEffect(() => {
    if (!processedStudent || !qrContainerRef.current) return;
    
    // Create a data object with student and exam info
    const qrData = JSON.stringify({
      school: schoolinfo?.name || 'School Name',
      session: student.session || new Date().getFullYear(),
      exam: 'Exam',
      name: student.name || student.studentName || 'Student',
      class: student.class || 'Class',
      roll: student.rollNo || student.rollNumber || student.roll || 'N/A',
    });

    try {
      // Clear previous QR code
      qrContainerRef.current.innerHTML = '';
      
      // Generate and render QR code directly to the container
      const qr = new QRCode({
        content: qrData,
        padding: 1,
        width: 80,
        height: 80,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M' // Error correction level (L, M, Q, H)
      });
      
      // Get SVG string and set it to the container
      const svgString = qr.svg();
      qrContainerRef.current.innerHTML = svgString;
      
      // Set the SVG string to state for potential re-renders
      setQrCodeSvg(svgString);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [processedStudent]);

  // Handle print styles and content ready notification
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    // Set mounted state
    setIsMounted(true);
    
    return () => {
      document.head.removeChild(styleElement);
      setIsMounted(false);
    };
  }, []);

  // Render QR code when component mounts or QR code data changes
  useEffect(() => {
    if (isMounted && qrContainerRef.current && qrCodeSvg) {
      qrContainerRef.current.innerHTML = qrCodeSvg;
    }
  }, [qrCodeSvg, isMounted]);

  // Use examResults directly - no processing needed
  const processedExamResults = processedStudent?.marks ? Object.entries(processedStudent.marks).map(([examTerm, examData]) => ({
    term: examTerm,
    subjectDetails: Object.entries(examData.subjectDetails || {}).reduce((acc, [subjectName, subjectData]) => {
      acc[subjectName] = {
        total: subjectData?.total || 0,
max: subjectData?.max || 0,
        percentage: subjectData?.percentage || 0,
        grade: subjectData?.grade || 'N/A',
        evaluations: subjectData.evaluations
      };
      return acc;
    }, {})
  })) : [];

  const navigate = useNavigate();
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
  }, [location.search, processedStudent]);

  console.log("student data in marksheet print page", processedStudent);

  if (!processedStudent || Object.keys(processedStudent).length === 0) {
    console.error('No student data available:', { processedStudent, location });
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
            boxSizing: 'border-box',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            {/* School Information */}
            <div style={{
              flex: 1,
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
                    {schoolinfo?.name}
                    {schoolinfo?.branch && (
                      <span style={{
                        marginLeft: '12px',
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 12px',
                        borderRadius: '20px',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        lineHeight: 1.4
                      }}>
                        {schoolinfo?.branch}
                      </span>
                    )}
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
                {schoolinfo?.regNumber && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '500' }}>Reg. No:</span>
                    <span>{schoolinfo?.regNumber}</span>
                  </div>
                )}
                {schoolinfo?.estd && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '500' }}>Established:</span>
                    <span>{schoolinfo?.estd}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Run by:</span>
                  <span>{schoolinfo?.runBy}</span>
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
                <span>{schoolinfo?.address}</span>
              </div>

            </div>

            {/* QR Code */}
            <div style={{
              width: '120px',
              height: '120px',
              backgroundColor: 'white',
              padding: '8px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                borderRadius: '4px'
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
                fontSize: '8px',
                color: '#4b5563',
                textAlign: 'center',
                marginTop: '4px',
                lineHeight: '1.2'
              }}>
                Scan to verify
              </div>
            </div>
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
            {academicYear || String(new Date().getFullYear() + 1)}
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
          padding: '5px',
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
          flex: '0 0 100px',  // Increased from 90px to 130px to accommodate taller photo
          position: 'relative'
        }}>
          <div style={{
            width: '80px',  // Increased from 60px to 80px
            height: '120px',  // Increased from 100px to 120px
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
                  alt={student.name || 'Student'}
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
                    const fallback = document.getElementById(`photo-fallback-${student?._id}`);
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  id={`photo-fallback-${student?._id}`}
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
                    fontSize: '11px',
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
        
        {/* Student Details - Two Row Layout */}
        <div style={{
          flex: '1',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '13px'
        }}>
          {/* Upper Row - Student Name, Class, Roll */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px 10px',
            alignItems: 'stretch'
          }}>
            {/* Student Name */}
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

            {/* Class */}
            <div>
              <div style={{
                fontSize: '11px',
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
                {student.classInfo?.name || student.class || 'N/A'}
              </div>
            </div>

            {/* Roll Number */}
            <div>
              <div style={{
                fontSize: '11px',
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
                {student.rollNo}
              </div>
            </div>
          </div>

          {/* Lower Row - Father's Name, DOB, Address */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px 10px',
            alignItems: 'stretch'
          }}>
            {/* Father's Name */}
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

            {/* Date of Birth */}
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
                {student.dob ? format(new Date(student.dob), 'dd-MMM-yyyy') : 'N/A'}
              </div>
            </div>

            {/* Address */}
            <div>
              <div style={{
                fontSize: '11px',
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
        </div>

        {/* Academic Performance */}
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
          }}>Academic Performance</h3>
          
          <div style={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginBottom: '20px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <table style={tableStyle} ref={printRef} cellSpacing="0" cellPadding="0">
              <thead>
                <tr>
                  <th rowSpan="2" style={{
                    padding: '4px 6px',
                    textAlign: 'left',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #94a3b8',
                    borderBottom: '2px solid #94a3b8',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '70px',
                    width: '70px',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1
                  }}>Subject</th>

                  {/* Exam Terms from actual data */}
                  {processedExamResults.map((exam, examIndex) => {
                    const evaluationTypes = exam.subjectDetails ?
                      Object.values(exam.subjectDetails).find(subject => subject.evaluations)?.evaluations?.map(e => e.type) || ['Written'] :
                      ['Written'];

                    return (
                      <th key={exam.term || examIndex} colSpan={evaluationTypes.length * 2} style={{
                        padding: '6px 2px',
                        textAlign: 'center',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #94a3b8',
                        borderBottom: '2px solid #94a3b8',
                        fontWeight: '700',
                        color: '#1e40af',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        width: '100px',
                        minWidth: '100px',
                        lineHeight: '1.2',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '700', fontSize: '12px' }}>
                            {exam.term ? exam.term.split(' ')[0] : `Exam ${examIndex + 1}`}
                          </span>
                          {exam.term && exam.term.split(' ').length > 1 && (
                            <span style={{ fontSize: '10px', fontWeight: '400', color: '#4b5563' }}>
                              {exam.term.split(' ').slice(1).join(' ')}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Total Column */}
                  <th rowSpan="2" style={{
                    padding: '4px 2px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #94a3b8',
                    borderBottom: '2px solid #94a3b8',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    width: '80px'
                  }}>
                    Total
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '2px',
                      marginTop: '2px',
                      fontSize: '10px',
                      fontWeight: 'normal'
                    }}>
                      <span style={{ textAlign: 'center', fontWeight: '600' }}>M.O.</span>
                      <span style={{ textAlign: 'center', color: '#64748b' }}>F.M.</span>
                    </div>
                  </th>

                  {/* Percentage Column */}
                  <th rowSpan="2" style={{
                    padding: '4px 2px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #94a3b8',
                    borderBottom: '2px solid #94a3b8',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '30px',
                    width: '30px',
                    fontSize: '12px',
                    lineHeight: '1.1',
                    boxSizing: 'border-box'
                  }}>%</th>

                  {/* Grade Column */}
                  <th rowSpan="2" style={{
                    padding: '4px 2px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #94a3b8',
                    borderBottom: '2px solid #94a3b8',
                    borderRight: '1px solid #94a3b8',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    minWidth: '45px',
                    width: '35px',
                    fontSize: '11px',
                    lineHeight: '1.1',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>Grade</th>
                </tr>

                <tr>
                  {/* Sub-columns for each exam term */}
                  {processedExamResults.map((exam, examIndex) => {
                    const evaluationTypes = exam.subjectDetails ?
                      Object.values(exam.subjectDetails).find(subject => subject.evaluations)?.evaluations?.map(e => e.type) || ['Written'] :
                      ['Written'];

                    return (
                      <React.Fragment key={`exam-sub-${examIndex}`}>
                        {evaluationTypes.map((evalType, idx) => (
                          <th key={`${exam.term || examIndex}-${evalType}`} colSpan="2" style={{
                            padding: '4px 2px',
                            textAlign: 'center',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #94a3b8',
                            borderBottom: '2px solid #94a3b8',
                            borderLeft: '1px solid #94a3b8',
                            borderRight: '1px solid #94a3b8',
                            color: '#1e293b',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            width: '60px',
                            minWidth: '60px',
                            lineHeight: '1.2',
                            boxSizing: 'border-box'
                          }}>
                            {evalType}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: '2px',
                              marginTop: '1px',
                              fontSize: '8px',
                              fontWeight: 'normal',
                              color: '#64748b'
                            }}>
                              <span style={{ textAlign: 'center', fontWeight: '600' }}>M.O.</span>
                              <span style={{ textAlign: 'center' }}>F.M.</span>
                            </div>
                          </th>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {processedExamResults.length > 0 && Object.keys(processedExamResults[0].subjectDetails).map((subjectName, index) => {
                  const subjectData = processedExamResults[0].subjectDetails[subjectName];
                  const subjectSummary = processedStudent?.subjectwiseSummary?.[subjectName];
                  
                  // Use subjectwiseSummary for total and max marks
                  const subjectTotal = subjectSummary?.obtainedTotal || 0;
                  const subjectMaxMarks = subjectSummary?.maxTotal || 0;
                  const subjectPercentage = subjectSummary?.percentage || 0;
                  const grade = subjectSummary?.grade || 'N/A';

                  return (
                    <tr key={subjectName} style={{
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      <td style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '500',
                        color: '#1e293b',
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap'
                      }}>
                        {subjectName}
                      </td>

                      {/* Data for each exam term */}
                      {processedExamResults.map((exam, examIndex) => {
                        const examSubjectData = exam.subjectDetails[subjectName];
                        const evaluationTypes = examSubjectData?.evaluations?.map(e => e.type) || ['Written'];

                        return (
                          <React.Fragment key={`exam-data-${examIndex}`}>
                            {evaluationTypes.map((evalType, idx) => {
                              const evaluation = examSubjectData?.evaluations?.find(e => e.type?.toLowerCase() === evalType.toLowerCase());
                              return (
                                <React.Fragment key={`${subjectName}-${exam.term}-${evalType}-${idx}`}>
                                  <td style={{
                                    padding: '10px 6px',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #f1f5f9',
                                    color: evaluation?.marks !== undefined ? '#1e293b' : '#94a3b8',
                                    fontWeight: evaluation?.marks !== undefined ? '500' : 'normal',
                                    whiteSpace: 'nowrap',
                                    minWidth: '60px',
                                    maxWidth: '80px',
                                    boxSizing: 'border-box'
                                  }} colSpan="2">
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                                      <span style={{ fontWeight: '600' }}>{evaluation?.marks !== undefined ? evaluation.marks : '--'}</span>
                                      <span style={{ color: '#94a3b8', margin: '0 1px' }}>/</span>
                                      <span style={{ color: '#94a3b8', fontWeight: '300' }}>{evaluation?.maxMarks !== undefined ? evaluation.maxMarks : '--'}</span>
                                    </div>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}

                      {/* Total Marks Column */}
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                        fontWeight: '600',
                        color: '#1e293b',
                        verticalAlign: 'middle',
                        width: '100px',
                        minWidth: '100px',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <span>{Math.round(subjectTotal)}</span>
                          <span style={{ color: '#9ca3af' }}>/</span>
                          <span style={{ color: '#64748b' }}>{subjectMaxMarks || '0'}</span>
                        </div>
                      </td>

                      {/* Percentage Column */}
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        color: '#1e40af',
                        verticalAlign: 'middle',
                        minWidth: '80px',
                        maxWidth: '100px',
                        boxSizing: 'border-box'
                      }}>
                        {Math.round(subjectPercentage) || '0'}%
                      </td>

                      {/* Grade Column */}
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                        minWidth: '80px',
                        maxWidth: '100px',
                        boxSizing: 'border-box'
                      }}>
                        {grade ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: {
                              'A1': '#d1fae5',
                              'A2': '#dcfce7',
                              'B1': '#f0fdf4',
                              'C1': '#854d0e',
                              'C2': '#854d0e',
                              'D': '#991b1b',
                              'E': '#991b1b'
                            }[grade] || '#1e293b',
                            color: {
                              'A1': '#065f46',
                              'A2': '#166534',
                              'B1': '#15803d',
                              'C1': '#fef9c3',
                              'C2': '#fef9c3',
                              'D': '#fef2f2',
                              'E': '#fef2f2'
                            }[grade] || '#ffffff',
                            minWidth: '40px'
                          }}>
                            {grade}
                          </span>
                        ) : 'N/A'}
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
                    padding: '4px 2px',
                    textAlign: 'left',
                    fontSize: '10px',
                    minWidth: '70px',
                    maxWidth: '90px',
                    color: '#1e40af',
                    whiteSpace: 'nowrap',
                    border: '1px solid #e2e8f0',
                    borderRight: 'none'
                  }} colSpan={1 + (processedExamResults.reduce((total, exam) => {
                    const evaluationTypes = exam.subjectDetails ?
                      Object.values(exam.subjectDetails).find(s => s.evaluations)?.evaluations?.map(e => e.type) || ['Written'] :
                      ['Written'];
                    return total + (evaluationTypes.length * 2);
                  }, 0))}>
                    Total Marks:
                  </td>

                  {/* Total Marks Column */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontWeight: '600',
                    color: '#1e40af',
                    fontSize: '14px',
                    verticalAlign: 'middle'
                  }}>
                    {Math.round(overallSummary.obtainedMarks) || '0'}
                    <span style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: 'normal',
                      marginLeft: '4px'
                    }}>
                      / {Math.round(overallSummary.totalMarks || 0)}
                    </span>
                  </td>

                  {/* Percentage Column */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontWeight: '600',
                    color: '#1e40af',
                    fontSize: '14px',
                    verticalAlign: 'middle'
                  }}>
                    {Math.round(overallSummary.percentage) || '0'}%
                  </td>

                  {/* Grade Column */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'none',
                    verticalAlign: 'middle'
                  }}>
                    {overallSummary.grade && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        borderRadius: '9999px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        minWidth: '40px'
                      }}>
                        {overallSummary.grade}
                      </span>
                    )}
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
              const grade = coScholastic[subject.key] || 'N/A';
              
              return (
                <div 
                  key={index} 
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
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

        {/* Summary Cards - Two Rows */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '12px'
        }}>
          {/* First Row - Two Large Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '10px'
          }}>
            {/* Marks & Percentage Card */}
            <div style={{
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #bae6fd',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              minHeight: '120px',
              padding: '10px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#0369a1',
                marginBottom: '6px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Marks & Performance</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    flex: 1,
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    padding: '3px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginBottom: '2px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#0369a1',
                        fontWeight: '500',
                        lineHeight: '1.2'
                      }}>Obtained</span>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#0c4a6e',
                        lineHeight: '1.2'
                      }}>{Math.round(overallSummary.obtainedMarks || 0)}</span>
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    padding: '3px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    border: '1px dashed #bae6fd',
                    marginBottom: '2px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                      opacity: 0.8
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#0369a1',
                        fontWeight: '500',
                        lineHeight: '1.2'
                      }}>Total</span>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#0c4a6e',
                        lineHeight: '1.2'
                      }}>{Math.round(overallSummary.totalMarks || 0)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '9px',
                  color: '#0369a1',
                  fontWeight: '500',
                  height: '16px'
                }}>
                  <span>Progress</span>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: '#e0f2fe',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(Math.max(processedStudent?.overallSummary?.percentage || 0, 0), 100)}%`,
                      backgroundColor: '#0ea5e9',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <span>{Math.round(processedStudent?.overallSummary?.percentage || 0)}%</span>
                </div>
              </div>
            </div>

            {/* Attendance Card */}
            <div style={{
              backgroundColor: '#f5f3ff',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #e0e7ff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              minHeight: '120px',
              padding: '10px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#4f46e5',
                marginBottom: '6px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Attendance Summary</span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flex: 1,
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    flex: 1,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    padding: '4px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#4f46e5',
                        fontWeight: '500',
                        lineHeight: '1.2'
                      }}>Present</span>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#4338ca',
                        lineHeight: '1.2'
                      }}>{attendanceSummary.getPresentDays()}</span>
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    padding: '4px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    border: '1px dashed #c7d2fe'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                      opacity: 0.8
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#4f46e5',
                        fontWeight: '500',
                        lineHeight: '1.2'
                      }}>Total Days</span>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#4338ca',
                        lineHeight: '1.2'
                      }}>{attendanceSummary.getTotalDays()}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                  fontSize: '9px',
                  color: '#4f46e5',
                  fontWeight: '500',
                  height: '16px'
                }}>
                  <span>Attendance</span>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: '#e0e7ff',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: attendanceSummary.shouldShowPercentage() ? `${Math.min(100, Math.max(0, attendanceSummary.getAttendancePercentage()))}%` : '0%',
                      backgroundColor: '#6366f1',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <span>{attendanceSummary.shouldShowPercentage() ? `${Math.round(attendanceSummary.attendancePercentage)}%` : '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Three Small Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '10px'
          }}>
          
          {/* Overall Grade Card */}
          <div style={{
            backgroundColor: '#fefce8',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #fef08a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: '60px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#854d0e',
              fontWeight: '600'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Overall Grade</span>
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#854d0e',
              lineHeight: '1'
            }}>
              {processedStudent.overallSummary?.grade || 'N/A'}
            </div>
          </div>

          {/* Class Rank Card */}
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: '60px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#1e40af',
              fontWeight: '600'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Class Rank</span>
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#1e40af',
              lineHeight: '1'
            }}>
              {processedStudent.overallSummary?.rank || 'N/A'}
              {processedStudent.overallSummary?.totalStudents && (
                <span style={{
                  fontSize: '9px',
                  color: '#3b82f6',
                  fontWeight: '500',
                  marginLeft: '4px',
                  opacity: 0.8
                }}>
                  of {processedStudent.overallSummary.totalStudents}
                </span>
              )}
            </div>
          </div>

          {/* Result Status Card */}
          {/* Final Result Card */}
          <div style={{
            backgroundColor: processedStudent?.overallSummary?.resultStatus?.toLowerCase() === 'pass' ? '#f0fdf4' : '#fef2f2',
            borderRadius: '8px',
            padding: '8px 12px',
            border: `1px solid ${processedStudent?.overallSummary?.resultStatus?.toLowerCase() === 'pass' ? '#86efac' : '#fca5a5'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: '60px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: processedStudent?.overallSummary?.resultStatus?.toLowerCase() === 'pass' ? '#15803d' : '#b91c1c',
              fontWeight: '600'
            }}>
              {processedStudent?.overallSummary?.resultStatus?.toLowerCase() === 'pass' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
              <span>Final Result</span>
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: '700',
              color: processedStudent?.overallSummary?.resultStatus?.toLowerCase() === 'pass' ? '#166534' : '#991b1b',
              lineHeight: '1',
              margin: '4px 0 2px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {processedStudent.overallSummary?.resultStatus || 'N/A'}
            </div>
          </div>
        </div>
      </div>

        </div>

        {/* Signature Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginTop: '2.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px dashed #e5e7eb',
          flexWrap: 'wrap'
        }}>
          {/* Class Teacher Signature */}
          <div style={{ 
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            paddingBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: '80px',
            position: 'relative',
            minWidth: '200px'
          }}>
            <div style={{
              color: '#4b5563',
              fontSize: '0.82rem',
              fontWeight: '500',
              textAlign: 'center',
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              padding: '0.5rem 0',
              borderTop: '1px solid #e5e7eb',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              Class Teacher
            </div>
          </div>
          
          {/* Principal Signature */}
          <div style={{ 
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            paddingBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: '80px',
            position: 'relative',
            minWidth: '200px'
          }}>
            <div style={{
              color: '#4b5563',
              fontSize: '0.82rem',
              fontWeight: '500',
              textAlign: 'center',
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              padding: '0.5rem 0',
              borderTop: '1px solid #e5e7eb',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              Principal
            </div>
          </div>
          
          {/* Guardian's Signature */}
          <div style={{ 
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            paddingBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: '80px',
            position: 'relative',
            minWidth: '200px'
          }}>
            <div style={{
              color: '#4b5563',
              fontSize: '0.82rem',
              fontWeight: '500',
              textAlign: 'center',
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              padding: '0.5rem 0',
              borderTop: '1px solid #e5e7eb',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              Parent/Guardian
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: 'linear-gradient(130deg, #0d9488, #0ea5e9)',
          padding: '0.4rem 0.8rem',
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '0.4rem',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Contact Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '0.2rem 0'
          }}>
            <a href={`tel:${schoolinfo?.contact?.phone || '+919876543210'}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>{schoolinfo?.contact?.phone || '+91 98765 43210'}</span>
            </a>
            
            <a href={`mailto:${schoolinfo?.contact?.email || 'info@schoolname.com'}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>{schoolinfo?.contact?.email || 'info@schoolname.com'}</span>
            </a>
            
            <a href={schoolinfo?.contact?.website ? `https://${schoolinfo.contact.website.replace(/^https?:\/\//, '')}` : '#'} 
               target="_blank" 
               rel="noopener noreferrer"
               style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'opacity 0.2s'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{schoolinfo?.contact?.website?.replace(/^https?:\/\//, '') || 'www.schoolname.com'}</span>
            </a>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetPrintPage;
