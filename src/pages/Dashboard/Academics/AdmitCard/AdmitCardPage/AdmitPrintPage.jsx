import React, { Fragment, useEffect, useRef, useState } from 'react';
import { formatDate, formatDateWithDay } from '@/utils/dateUtils';
import { FaCalendarAlt, FaUserGraduate, FaClipboardList, FaMapMarkerAlt } from 'react-icons/fa';
import { schoolinfo } from "@/shared/schoolInformation";
import QRCode from 'qrcode-svg';

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
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
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
    }
    img, svg {
      max-width: 100% !important;
    }
  }
`;

// Table cell styles
const tableHeaderStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  backgroundColor: '#f8fafc',
  color: '#1e40af',
  fontWeight: 600,
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.35px',
  border: '1px solid #e2e8f0',
  borderBottom: '2px solid #3b82f6',
  whiteSpace: 'nowrap',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
};

const tableCellStyle = {
  padding: '8px 12px',
  fontSize: '12.5px',
  color: '#334155',
  border: '1px solid #e2e8f0',
  backgroundColor: '#fff',
  textAlign: 'left',
  lineHeight: '1.4',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease'
};

// Add alternating row colors
const getRowStyle = (index) => ({
  ...tableCellStyle,
  backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc'
});

const AdmitPrintPage = ({ student, examConfig, isPrintMode = false, onContentReady, selectedExam }) => {
  // Refs
  const printRef = useRef(null);
  const qrContainerRef = useRef(null);
  
  // State
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  console.log("student", student);
  console.log("examconfig", examConfig);
  
  // Early return if no data
  if (!student || !examConfig) {
    return <div className="p-4 text-center text-gray-600">No student or exam data available</div>;
  }

  // Generate QR code with student and exam info
  useEffect(() => {
    if (!student || !examConfig || !qrContainerRef.current) return;
    
    // Create a data object with student and exam info
    const qrData = JSON.stringify({
      school :"DINA PUBLIC SCHOOL - PAHARPUR",
      session:2025,
      exam: examConfig.name,
      name: student.studentName,
      class: student.classInfo?.name || student.class,
      roll:student.roll,
    });

    try {
      // Clear previous QR code
      qrContainerRef.current.innerHTML = '';
      
      // Generate and render QR code directly to the container
      const qr = new QRCode({
        content: qrData,
        padding: 1,
        width: 100,
        height: 100,
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
  }, [student, examConfig]);

  // Handle print styles and content ready notification
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    // Set mounted state
    setIsMounted(true);
    
    // Notify parent that content is ready
    if (onContentReady) {
      onContentReady();
    }
    
    return () => {
      document.head.removeChild(styleElement);
      setIsMounted(false);
    };
  }, [onContentReady]);

  // Render QR code when component mounts or QR code data changes
  useEffect(() => {
    if (isMounted && qrContainerRef.current && qrCodeSvg) {
      qrContainerRef.current.innerHTML = qrCodeSvg;
    }
  }, [qrCodeSvg, isMounted]);

  // Normalize student data
  const normalizedStudent = {
    ...student,
    fullName: student.studentName || student.name || 'N/A',
    rollNumber: student.roll || student.admissionNumber || 'N/A',
    className: student.classInfo?.name || student.class || 'N/A',
    section: student.section || student.classInfo?.section || 'N/A',
    session: student.session || student.classInfo?.session || 'N/A',
    motherName: student.motherName || 'N/A',
    fatherName: student.fatherName || 'N/A',
    address: student.address || 'N/A',
    dob: student.dob || 'N/A'
  };

  // Extract the exam config from the nested structure
  const examName = Object.keys(examConfig.examConfig || {})[0] || '';
  const examDetails = examConfig.examConfig?.[examName] || {};
  
  // Normalize exam config
  const normalizedExamConfig = {
    ...examConfig,
    ...examDetails, // Spread the exam details into the config
    examName: examName || examConfig.examName,
    academicYear: '2025',
    startDate: examConfig.startDate || Object.values(examDetails.schedule || {}).flatMap(s => 
      Object.values(s).map(d => d.examDate)
    ).sort()[0],
    endDate: examConfig.endDate || Object.values(examDetails.schedule || {}).flatMap(s => 
      Object.values(s).map(d => d.examDate)
    ).sort().pop()
  };

  // Get evaluation types from exam config or default to ['Written', 'Oral']
  const evaluationTypes = examDetails.evaluationTypes || examConfig.evaluationTypes || ['Written', 'Oral'];
  
  // Ensure we have the correct subjects and schedule from the exam details
  const effectiveExamConfig = {
    ...examConfig,
    ...examDetails,
    evaluationTypes,
    subjects: examDetails.subjects || examConfig.subjects || [],
    schedule: examDetails.schedule || examConfig.schedule || {}
  };
  
  // Colors for different evaluation types
  const evaluationTypeColors = {
    'Written': '#1e40af',
    'Oral': '#0369a1',
    'Practical': '#166534'
  };
  
  const evaluationTypeBgColors = {
    'Written': '#f0f5ff',
    'Oral': '#f0f9ff',
    'Practical': '#f0fdf4'
  };

  // Add debug logging
  console.log('Effective Exam Config:', effectiveExamConfig);
  console.log('Schedule:', effectiveExamConfig.schedule);
  console.log('Evaluation Types:', evaluationTypes);
  
  // Prepare subjects for display from effectiveExamConfig
  const examSubjects = effectiveExamConfig.subjects?.length > 0 
    ? effectiveExamConfig.subjects.map(subject => {
        // Get the subject schedule from the schedule object
        const subjectSchedule = effectiveExamConfig.schedule?.[subject] || {};
        console.log(`Subject: ${subject}`, subjectSchedule);
        
        // Split the timing into start and end times
        const [startTime = 'TBA', endTime = 'TBA'] = 
          (subjectSchedule.timing || 'TBA - TBA').split(' - ').map(t => t.trim());
        
        // Initialize subject data with evaluation types
        const subjectData = {
          name: subject,
          code: subject.substring(0, 3).toUpperCase(),
          totalMarks: 0
        };
        
        // Process each evaluation type
        evaluationTypes.forEach(type => {
          const typeLower = type.toLowerCase();
          const evalData = subjectSchedule[type] || {};
          const typeMarks = effectiveExamConfig.fullMarks?.[subject]?.[type] || 0;
          
          console.log(`Processing ${type} for ${subject}:`, {
            evalData,
            typeMarks,
            fullMarks: effectiveExamConfig.fullMarks?.[subject]
          });
          
          // Add evaluation type data
          subjectData[`${typeLower}Marks`] = typeMarks;
          
          // Set date and time from the schedule
          subjectData[`${typeLower}Date`] = evalData.examDate || 'TBA';
          subjectData[`${typeLower}StartTime`] = evalData.startTime || 'TBA';
          subjectData[`${typeLower}EndTime`] = evalData.endTime || 'TBA';
          
          // Update total marks
          subjectData.totalMarks += typeMarks;
        });
        
        return subjectData;
      })
    : [];

  // Format date of birth (using the utility function)
  const formatDateOfBirth = (dateString) => {
    const formatted = formatDate(dateString, 'dd/MM/yyyy');
    return formatted || 'N/A';
  };

  // Format exam date with day name (using the utility function)
  const formatExamDate = (dateString) => {
    if (!dateString) return 'TBA';
    const formatted = formatDateWithDay(dateString);
    return formatted ? (
      <div style={{ whiteSpace: 'nowrap' }}>
        {formatted}
      </div>
    ) : 'TBA';
  };

  // Notify parent when content is loaded
  useEffect(() => {
    if (onContentReady) {
      onContentReady();
    }
  }, [onContentReady]);
  
  const containerStyle = {
    position: 'relative',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '1rem',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    '::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: -1,
      margin: '-2px',
      borderRadius: '0.6rem',
      background: 'linear-gradient(135deg, #0ea5e9, #0d9488, #4CAF50)',
      padding: '2px',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
    },
    '::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: -2,
      margin: '-2px',
      borderRadius: '0.6rem',
      background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(33, 150, 243, 0.1), rgba(52, 135, 253, 0.1))',
      padding: '2px',
    },
    '@media print': {
      boxShadow: 'none',
      padding: '0',
      maxWidth: '100%',
      margin: 0,
      '::before': {
        display: 'none'
      },
      '::after': {
        display: 'none'
      }
    },
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.4',
    color: '#1f2937',
    fontSize: '13px',
    background: '#fff',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: -1,
      borderRadius: '0.5rem',
      background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
      margin: '-2px',
    }
  };

  return (
    <div style={{
      padding: '2px',
      background: 'linear-gradient(135deg, #0ea5e9, #0d9488, #4CAF50)',
      borderRadius: '0.6rem',
      margin: '1rem auto',
      maxWidth: '1004px',
      '@media print': {
        background: 'none',
        padding: 0,
        margin: 0
      }
    }}>
      <div style={containerStyle}>
        {/* Watermark */}
        {/* School Info Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          paddingBottom: '20px',
          paddingTop: '5px',
          width: '100%',
          height: '150px',
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
        {/* School Info */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems:"center"
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '0.5rem',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <h1 style={{
              fontSize: '36px',
              color: '#1e40af',
              marginTop: '1rem',
              padding: '0.1rem 0 0.75rem 0',
              fontWeight: 700,
              fontFamily: '"Roboto Slab", serif',
              letterSpacing: '-0.02em',
              display: 'block',
              textAlign: 'center',
              position: 'relative',
              lineHeight: '1.2'
            }}>
              {schoolinfo?.schoolName || 'Dina Public School'}
              {schoolinfo?.branch && (
                <span style={{
                  marginLeft: '12px',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 12px',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  fontFamily: 'Poppins, sans-serif',
                  color: '#ffffff',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                  background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1.4
                }}>
                  {schoolinfo.branch}
                </span>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '2px',
                background: 'linear-gradient(270deg,  #2196F3, #4CAF50)',
                borderRadius: '1px'
              }}></div>
            </h1>
          </div>
        </div>

        {/* School Meta Info */}
        <div style={{
          marginTop: '-15px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          fontSize: '14px',
          color: '#374151',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {schoolinfo?.regNumber && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Reg. No:</span>
              <span style={{ marginLeft: '6px', fontWeight: 500 }}>{schoolinfo.regNumber}</span>
            </div>
          )}
          {schoolinfo?.estd && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Established:</span>
              <span style={{ marginLeft: '6px', fontWeight: 500 }}>{schoolinfo.estd}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>Run by:</span>
            <span style={{ marginLeft: '6px', fontWeight: 500 }}>{schoolinfo?.runBy || 'M.M.D.C.T.'}</span>
          </div>
        </div>

        {/* School Address */}
        <div style={{
          margin: '5px 0',
          fontSize: '14px',
          color: '#374151',
          padding: '12px 20px',
          borderRadius: '6px',
          background: 'white',
          fontWeight: 500,
          fontFamily: 'Poppins, sans-serif',
          border: '1px solid #e5e7eb',
          lineHeight: '1.5'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <FaMapMarkerAlt size={12} style={{ color: '#4CAF50' }} />
            <span>
              {schoolinfo.address}
            </span>
          </div>
       
</div>

        </div>

        {/* QR code */}
        <div style={{
            width: '120px',
            height: '120px',
            padding: '1px',
            borderRadius: '0.25rem',
            background: 'linear-gradient(270deg, #4CAF50, #2196F3)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 'calc(100% - 2px)',
              height: 'calc(100% - 2px)',
              backgroundColor: 'white',
              borderRadius: '0.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px',
              boxSizing: 'border-box'
            }}>
              <div 
                ref={qrContainerRef} 
                style={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  boxSizing: 'border-box'
                }}
              ></div>
            </div>
          </div>
      </div>

        {/* Admit Card Title */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
          marginTop:"6px",
          padding: '2px 10px',
          borderLeft: '4px solid #4CAF50',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '0 10px'
          }}>
            <h2 style={{
              margin: 0,
              color: '#2c3e50',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Admit Card - {selectedExam}
            </h2>
            <span style={{
              color: '#4b5563',
              fontSize: '16px',
              fontWeight: 500,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}>
              Academic Year : 2025
            </span>
          </div>
        </div>
     

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '3px',
        marginBottom: '3px',
        backgroundColor: '#f9fafb',
        padding: '0.75rem',
        borderRadius: '0.4rem',
        border: '1px solid #e5e7eb',
        fontSize: '12.5px',
      }}>
        {/* Student Photo and QR Code */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          width: '110px',
          flexShrink: 0,
          padding: '0.4rem',
          backgroundColor: '#f8fafc',
          borderRadius: '0.4rem',
          border: '1px solid #e2e8f0'
        }}>
          {/* Student Photo */}
          <div style={{
            width: '100%',
            aspectRatio: '6/7',
            border: '1px solid #dbeafe',
            borderRadius: '0.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              color: '#9ca3af',
              fontSize: '0.7rem',
              textAlign: 'center'
            }}>
              {student?.photo ? (
                <img
                  src={student.photo}
                  alt="Student"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                'Student Photo'
              )}
            </div>
          </div>
      
       
        </div>

        {/* Student Details */}
        <div 
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 0.7fr 1fr',
          gap: '0.75rem 1rem',
          alignContent: 'start',
          padding: '0.5rem 0'
        }}>
          {/* Row 1 */}
          <div>
            <div 
            style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>Class </div>
            <div 
            style={{
              fontWeight: 500,
              padding: '0.375rem 0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {student?.class }
            </div>
          </div>
          
          <div>
            <div 
            style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>Roll Number</div>
            <div 
            style={{
              fontWeight: 500,
              padding: '0.375rem 0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {student?.roll|| 'N/A'}
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 1' }}>
            <div 
            style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>Full Name</div>
            <div 
            style={{
              fontWeight: 500,
              padding: '0.375rem 0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {student?.studentName || 'N/A'}
            </div>
          </div>
          
          {/* Row 2 */}
          <div>
            <div 
            style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>Father's Name</div>
            <div
             style={{
              fontWeight: 500,
              padding: '0.375rem 0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {student?.fatherName || 'N/A'}
            </div>
          </div>
          
          <div>
            <div 
            style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>Date of Birth</div>
            <div 
            style={{
              fontWeight: 500,
              padding: '0.375rem 0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {student?.dob ? formatDate(student.dob, 'dd-MMM-yyyy') : 'N/A'}
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 1' }}>
            <div
             style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}>Address</div>
            <div
             style={{
              fontWeight: 500,
              padding: '0.375rem 0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {student?.address || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Schedule & Marks Distribution */}
      <div style={{ 
        minHeight: '330px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        ':hover': {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
        }
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '0 -1.25rem',
          padding: '0.2rem 1rem',
          marginBottom: '0.1rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          position: 'relative',
          '::after': {
            content: '""',
            position: 'absolute',
            bottom: '-1px',
            left: '1.25rem',
            right: '1.25rem',
            height: '1px',
            backgroundColor: 'rgba(226, 232, 240, 0.7)'
          }
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#1e40af',
            marginLeft: "20px",
            padding: '2px 0',
          }}>
            Exam Schedule & Marks Distribution
          </h3>
          <div style={{
            fontSize: '0.875rem',
            color: '#4b5563',
            marginRight:"20px",
            fontWeight: 500
          }}>
            Total Marks: {Object.values(examConfig.fullMarks || {}).reduce((sum, marks) => 
              sum + (marks.Written || 0) + (marks.Oral || 0) + (marks.Practical || 0), 0
            )}
          </div>
        </div>

        <div style={{
          width: '100%',
          overflowX: 'auto',
          marginTop: '0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            backgroundColor: '#fff',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#f3f4f6',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <th style={{
                  ...tableHeaderStyle,
                  textAlign: 'left',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  minWidth: '80px',
                  maxWidth: '100px',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  padding: '0.3rem 0.4rem'
                }}>Subject</th>
                
                {/* Dynamic Exam Type Headers */}
                {evaluationTypes.map(type => {
                  const color = evaluationTypeColors[type] || '#6b7280';
                  const bgColor = evaluationTypeBgColors[type] || '#f3f4f6';
                  
                  return (
                    <th 
                      key={type}
                      colSpan="4" 
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: color,
                        backgroundColor: bgColor,
                        border: '1px solid #e5e7eb',
                        whiteSpace: 'nowrap',
                        fontSize: '12.5px'
                      }}
                    >
                      {type}
                    </th>
                  );
                })}
                
                <th style={{
                  ...tableHeaderStyle,
                  textAlign: 'center',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  position: 'sticky',
                  right: 0,
                  zIndex: 2,
                  minWidth: '60px',
                  maxWidth: '70px',
                  padding: '0.25rem 0.3rem',
                  backgroundColor: '#f3f4f6'
                }}>Total</th>
              </tr>
              
              {/* Sub-headers */}
              <tr style={{
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <th style={{
                  padding: '0.4rem 0.8rem',
                  textAlign: 'left',
                  fontWeight: 500,
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.8125rem',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  backgroundColor: '#f9fafb'
                }}></th>
                
                {/* Sub-headers for each evaluation type */}
                {evaluationTypes.map(type => {
                  const color = evaluationTypeColors[type] || '#6b7280';
                  const bgColor = evaluationTypeBgColors[type] || '#f3f4f6';
                  
                  return (
                    <React.Fragment key={type}>
                      <th style={{
                        padding: '0.3rem 0.4rem',
                        textAlign: 'center',
                        fontWeight: 500,
                        color: color,
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        backgroundColor: bgColor
                      }}>Date</th>
                      <th style={{
                        padding: '0.3rem 0.4rem',
                        textAlign: 'center',
                        fontWeight: 500,
                        color: color,
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        backgroundColor: bgColor
                      }}>Start</th>
                      <th style={{
                        padding: '0.3rem 0.4rem',
                        textAlign: 'center',
                        fontWeight: 500,
                        color: color,
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        backgroundColor: bgColor
                      }}>End</th>
                      <th style={{
                        padding: '0.3rem 0.4rem',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: color,
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        backgroundColor: bgColor,
                        borderRight: '1px solid #e5e7eb'
                      }}>Marks</th>
                    </React.Fragment>
                  );
                })}
                
                <th style={{
                  padding: '0.4rem 0.8rem',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.8125rem',
                  position: 'sticky',
                  right: 0,
                  zIndex: 2,
                  backgroundColor: '#f9fafb'
                }}></th>
              </tr>
            </thead>
            <tbody>
              {examSubjects.map((subject, index) => {
                const hasWritten = subject.writtenMarks > 0;
                const hasOral = subject.oralMarks > 0;
                
                return (
                  <tr key={index}>
                    {/* Subject Name */}
                    <td style={{
                      ...tableCellStyle,
                      fontWeight: 600,
                      color: '#1f2937',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      background: '#fff',
                      zIndex: 1,
                      width: '1%',  // Auto width based on content
                      minWidth: '80px',   // Further reduced min-width
                      maxWidth: '100px',  // Further reduced max-width
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.4rem'  // Even tighter padding
                    }}>
                      {subject.name || 'Subject Name'}
                    </td>

                    {/* Dynamic evaluation type columns */}
                    {evaluationTypes.map(type => {
                      const typeLower = type.toLowerCase();
                      const hasMarks = subject[`${typeLower}Marks`] > 0;
                      const color = evaluationTypeColors[type] || '#6b7280';
                      const bgColor = evaluationTypeBgColors[type] || '#f3f4f6';
                      
                      if (!hasMarks) {
                        return (
                          <td key={type} colSpan="4" style={{ 
                            ...tableCellStyle, 
                            textAlign: 'center', 
                            color: '#9ca3af',
                            backgroundColor: bgColor
                          }}>-</td>
                        );
                      }
                      
                      return (
                        <React.Fragment key={type}>
                          <td style={{ 
                            ...tableCellStyle, 
                            textAlign: 'center',
                            backgroundColor: bgColor,
                            color: color,
                            padding: '0.2rem 0.3rem',
                            fontSize: '12px'
                          }}>
                            {subject[`${typeLower}Date`] ? formatExamDate(subject[`${typeLower}Date`]) : 'TBA'}
                          </td>
                          <td style={{ 
                            ...tableCellStyle, 
                            textAlign: 'center',
                            backgroundColor: bgColor,
                            color: color,
                            padding: '0.2rem 0.3rem',
                            fontSize: '12px'
                          }}>
                            {subject[`${typeLower}StartTime`] || 'TBA'}
                          </td>
                          <td style={{ 
                            ...tableCellStyle, 
                            textAlign: 'center',
                            backgroundColor: bgColor,
                            color: color,
                            padding: '0.2rem 0.3rem',
                            fontSize: '12px'
                          }}>
                            {subject[`${typeLower}EndTime`] || 'TBA'}
                          </td>
                          <td style={{
                            ...tableCellStyle,
                            textAlign: 'center',
                            color: color,
                            fontWeight: 600,
                            backgroundColor: bgColor,
                            padding: '0.2rem 0.3rem',
                            fontSize: '12px'
                          }}>
                            {subject[`${typeLower}Marks`]}
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Total Marks */}
                    <td style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#1f2937',
                      backgroundColor: '#f9fafb',
                      position: 'sticky',
                      right: 0,
                      zIndex: 1,
                      width: '60px',  // Fixed width
                      minWidth: '60px',
                      maxWidth: '70px',
                      whiteSpace: 'nowrap',
                      padding: '0.2rem 0.3rem',
                      fontSize: '0.7rem'
                    }}>
                      {subject.totalMarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        margin: '0.5rem 0',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #0ea5e9, #0d9488)',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #86efac'
        }}>
          <svg style={{
            height: '1rem',
            width: '1rem',
            color: 'white',
            marginRight: '0.5rem',
            flexShrink: 0
          }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'white',
            margin: 0,
            letterSpacing: '0.2px'
          }}>গুরুত্বপূর্ণ নির্দেশাবলী / Important Instructions</h3>
        </div>
        
        <div style={{
          padding: '0.75rem 1rem 0.85rem 1rem'
        }}>
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: '0.5rem'
          }}>
            {[
              'পরীক্ষার হলে এডমিট কার্ড আনতেই হবে। এডমিট কার্ড ছাড়া পরীক্ষা দিতে দেওয়া হবে না।',
              'নিজস্ব লেখার সামগ্রী ও প্রয়োজনীয় জিনিসপত্র সঙ্গে আনতেই হবে।',
              'পরীক্ষার নির্ধারিত সময়ের ৩০ মিনিট আগে পরীক্ষা হলে উপস্থিত হতে হবে। দেরি করলে প্রবেশে বাধা দেওয়া হতে পারে।',
              'মোবাইল ফোন ও যে কোন ইলেকট্রনিক ডিভাইস সঙ্গে আনা নিষিদ্ধ। এ ধরনের কোন ডিভাইস পাওয়া গেলে তা বাজেয়াপ্ত করা হবে।',
              'স্কুলের নির্ধারিত ইউনিফর্ম পরিধান করে আসতে হবে এবং স্কুল আইডি কার্ড সঙ্গে আনতেই হবে।'
            ].map((instruction, idx) => (
              <li key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                color: '#1a3a3a',
                fontSize: '0.7rem',
                lineHeight: '1.2',
                marginBottom: '0.2rem'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '0.9rem',
                  height: '0.9rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
                  color: 'white',
                  fontSize: '0.45rem',
                  fontWeight: '600',
                  marginRight: '0.3rem',
                  flexShrink: 0,
                  marginTop: '0.05rem'
                }}>
                  {idx + 1}
                </span>
                <span className="bengali-text" style={{
                  fontSize: '0.75rem',
                  lineHeight: '1.3'
                }}>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Signatures */}
      <div style={{
        margin: '0.2rem 0 0.5rem 0',
        padding: '0.3rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 1px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          maxWidth: '900px',
          margin: '0 auto',
          position: 'relative'
        }}>
          {/* Student Signature */}
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
            position: 'relative'
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
              Student's Signature
            </div>
          </div>
          
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
            position: 'relative'
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
            position: 'relative'
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
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: 'linear-gradient(130deg, #0d9488, #0ea5e9)',
        padding: '0.4rem 0.8rem',
        marginTop: '0.3rem',
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
        zIndex: 1,
        '::after': {
          content: '""',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          height: '15px',
          backgroundColor: '#f0fdf4',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem'
        },
        '@media print': {
          bottom: 0,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }
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
          <a href={`tel:${schoolinfo?.phone || '+919876543210'}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            ':hover': {
              opacity: 0.9
            }
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>{schoolinfo?.contact.phone || '+91 98765 43210'}</span>
          </a>
          
          <a href={`mailto:${schoolinfo?.contact.email || 'info@schoolname.com'}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            ':hover': {
              opacity: 0.9
            }
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>{schoolinfo?.contact.email || 'info@schoolname.com'}</span>
          </a>
          
          <a href={schoolinfo?.website ? `https://${schoolinfo.contact.website.replace(/^https?:\/\//, '')}` : '#'} 
             target="_blank" 
             rel="noopener noreferrer"
             style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              ':hover': {
                opacity: 0.9
              }
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>{schoolinfo?.contact.website?.replace(/^https?:\/\//, '') || 'www.schoolname.com'}</span>
          </a>
        </div>

    
        
      </div>

      </div>
    </div>
  );
};

export default AdmitPrintPage;