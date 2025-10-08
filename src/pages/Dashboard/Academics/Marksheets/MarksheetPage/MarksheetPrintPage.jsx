import React, { useEffect, useRef, useState, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaUser, FaQrcode, FaStar } from 'react-icons/fa';
import QRCode from 'qrcode-svg';
import { schoolinfo } from '@/shared/schoolInformation';

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

const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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

// Common styles
const containerStyle = {
  maxWidth: '210mm',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#fff',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)'
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
  margin: '20px 0'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '15px 0',
  fontSize: '14px'
};

const thStyle = {
  backgroundColor: '#1e40af',
  color: 'white',
  padding: '10px',
  textAlign: 'left',
  border: '1px solid #e2e8f0'
};

const tdStyle = {
  padding: '10px',
  border: '1px solid #e2e8f0',
  textAlign: 'left'
};

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
  academicYear = '2024-2025',
  school = {}
}) => {
  const navigate = useNavigate();
  const printRef = useRef();
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
  
  // Generate QR code with student details
  useEffect(() => {
    if (studentData.rollNumber || studentData.admissionNo) {
      const qrData = JSON.stringify({
        name: studentData.studentName || studentData.name || '',
        roll: studentData.rollNumber || '',
        class: studentData.Class || '',
        section: studentData.section || '',
        admissionNo: studentData.admissionNo || ''
      });
      
      const qr = new QRCode({
        content: qrData,
        padding: 2,
        width: 80,
        height: 80,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M'
      });
      
      setQrCodeSvg(qr.svg());
    }
  }, [studentData]);
  
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
      <div style={containerStyle}>
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>No student data available</h2>
          <button 
            onClick={handleGoBack} 
            style={{
              ...buttonStyle,
              backgroundColor: '#6b7280',
              '&:hover': {
                backgroundColor: '#4b5563'
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
    <div>
      <div ref={printRef} style={{
        ...containerStyle,
        margin: '0.5rem auto',
        padding: '0.5rem',
        backgroundColor: '#fff',
        boxShadow: '0 0 0 2px #fff, 0 0 0 4px #4CAF50, 0 0 10px 4px rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: '1.4',
        color: '#1f2937',
        fontSize: '13px'
      }}>
        {/* Report Card Title */}
   
        {/* Main Content Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          {/* School Info Card */}
          <div style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: '1.25rem',
            
          }}>
          {/* School Info */}
          <div style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: '60%',
              width: '1px',
              backgroundColor: '#e2e8f0'
            }
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              <h1 style={{
                fontSize: '24px',
                color: '#1e40af',
                margin: '0 0 0.25rem 0',
                padding: 0,
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
              gap: '8px 16px',
              marginBottom: '6px',
              fontSize: '11px',
              color: '#4b5563',
              lineHeight: '1.3'
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
              marginBottom: '6px',
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
            
            <div style={{
              marginTop: '10px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <span>REPORT CARD</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#4b5563',
                  backgroundColor: '#f8fafc',
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
                  {academicYear || student.session || '2024-2025'}
                </span>
              </h2>
              
            </div>
            
          </div>
          
         
        </div>
      </div>
      <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          color: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '600',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            REPORT CARD
          </h1>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            opacity: '0.9'
          }}>
            2024-2025
          </div>
        </div>

      <div>
        {/* Student Info with Photo */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '25px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          borderLeft: '4px solid #1e40af',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}>
        {/* Student Photo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          flex: '0 0 120px'
        }}>
          <div style={{
            width: '100px',
            height: '120px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            margin: '0 auto'
          }}>
            {student.photo ? (
              <img 
                src={student.photo} 
                alt="Student" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = (
                    '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9;">' +
                    '<FaUser size="32" color="#94a3b8" />' +
                    '</div>'
                  );
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                textAlign: 'center',
                padding: '8px',
                fontSize: '11px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <FaUser size={24} style={{ marginBottom: '4px' }} />
                Photo
              </div>
            )}
          </div>
        </div>
        
        {/* Student Details - 3 Column Layout */}
        <div style={{
          flex: '1',
          minWidth: '400px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',  
          gap: '12px 20px',
          alignContent: 'flex-start'
        }}>
            {/* Column 1 */}
            <div>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '2px',
                fontWeight: '500'
              }}>Student Name</div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                padding: '8px 12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {student.studentName || student.name || 'N/A'}
              </div>
            </div>
            
            {/* Column 2 */}
            <div>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '2px',
                fontWeight: '500'
              }}>Father's Name</div>
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
                {student.fatherName || 'N/A'}
              </div>
            </div>
            
            {/* Column 3 - Date of Birth */}
            <div>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '2px',
                fontWeight: '500'
              }}>Date of Birth</div>
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
                {student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'}
              </div>
            </div>
            
            {/* Row 2 - Class */}
            <div>
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
            
            {/* Row 2 - Address */}
            <div style={{ gridColumn: '2 / 4' }}>
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
                        whiteSpace: 'nowrap',
                        minWidth: '80px'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>{evalItem.type || `Exam ${idx + 1}`}</div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: 'normal'
                        }}>(Max: {evalItem.maxMarks || 100})</div>
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
                      whiteSpace: 'nowrap',
                      minWidth: '80px'
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
                {examResults.map((subject, index) => {
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
  );
};

export default MarksheetPrintPage;
