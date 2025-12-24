import React, { useRef, useState,useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { FaPrint, FaTimes } from 'react-icons/fa';
import { schoolinfo } from '@/shared/schoolInformation';
import QRCode from 'qrcode-svg';

const PrintResultModal = ({ 
  open, 
  onClose, 
  studentData,
  resultData
}) => {
  const printRef = useRef();
  const [qrCodeSvg, setQrCodeSvg] = useState('');

  useEffect(() => {
    // Generate QR code with student data
    const studentInfo = {
      school: "DINA PUBLIC SCHOOL - PAHARPUR",
      class: studentData?.class || '',
      roll: studentData?.roll || '',
      exam: resultData?.term || '',
      academicYear: '2025',
    };

    try {
      // Check if QRCode is available
      if (typeof QRCode === 'undefined') {
        console.warn('QRCode library not loaded');
        setQrCodeSvg(null);
        return;
      }

      const qrCode = new QRCode({
        content: JSON.stringify(studentInfo),
        padding: 2,
        width: 90,
        height: 90,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M' // Error correction level: L, M, Q, H
      }).svg();

      setQrCodeSvg(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeSvg(null);
    }
  }, [studentData, resultData]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { 
        size: A4;
        margin: 8mm 10mm 10mm 10mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print { 
          display: none !important; 
        }
      }
    `
  });

  if (!studentData || !resultData) return null;

  // Inline styles
  const styles = {
    modalContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: open ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 50
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    content: {
      position: 'relative',
      backgroundColor: '#fff',
      borderRadius: '0.5rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      width: '100%',
      maxWidth: '56rem',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid #e5e7eb',
      position: 'relative',
      zIndex: 10
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      transition: 'all 0.2s'
    },
    printButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      marginRight: '0.5rem'
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: '1px solid #d1d5db',
      color: '#374151'
    },
    studentCard: {
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    summaryCard: {
      backgroundColor: '#f0f9ff',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      marginTop: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      margin: '0.4rem 0',
      fontSize: '0.85rem',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
    },
    th: {
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      padding: '0.3rem 0.5rem',
      textAlign: 'center',
      fontWeight: 600,
      color: '#1f2937',
      verticalAlign: 'middle',
      lineHeight: '1.2'
    },
    td: {
      border: '1px solid #e5e7eb',
      padding: '0.3rem 0.4rem',
      textAlign: 'center',
      color: '#4b5563',
      verticalAlign: 'middle',
      lineHeight: '1.3'
    },
    subHeader: {
      fontSize: '0.6rem',
      color: '#6b7280',
      display: 'block',
      marginTop: '0.1rem',
      fontWeight: 'normal',
      lineHeight: '1.1'
    }
  };

  return (
    <div style={styles.modalContainer}>
      <div style={styles.overlay} onClick={onClose}></div>
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header} className="no-print">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Print Result</h2>
          <div style={{ display: 'flex' }}>
            <button 
              onClick={handlePrint}
              style={{ ...styles.button, ...styles.printButton }}
            >
              <FaPrint style={{ marginRight: '0.5rem' }} />
              Print
            </button>
            <button
              onClick={onClose}
              style={{ ...styles.button, ...styles.closeButton }}
            >
              <FaTimes style={{ marginRight: '0.5rem' }} />
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={printRef} style={{ padding: '0.25rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '0.2rem', paddingBottom: '0.2rem', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.4rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              {/* School Information */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {schoolinfo.name || 'School Name'}
                  </h1>
                  {schoolinfo.branch && (
                    <span style={{
                      background: 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      {schoolinfo.branch} BRANCH
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {schoolinfo.regNumber && (
                    <span style={{
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb'
                    }}>
                      Reg. No: {schoolinfo.regNumber}
                    </span>
                  )}
                  {schoolinfo.estd && (
                    <span style={{
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb'
                    }}>
                      Est. {schoolinfo.estd}
                    </span>
                  )}
                  {schoolinfo.runBy && (
                    <span style={{
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb'
                    }}>
                      Run by: {schoolinfo.runBy}
                    </span>
                  )}
                  {schoolinfo.curriculamFollows && (
                    <span style={{
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb'
                    }}>
                      Curriculum: {schoolinfo.curriculamFollows}
                    </span>
                  )}
                </div>

                <p style={{ color: '#4b5563', marginBottom: '0.25rem', margin: 0, fontSize: '0.875rem' }}>
                  {schoolinfo.address || 'School Address'}
                </p>
              </div>

              {/* QR Code */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '2px solid #166534', // School Green
                boxShadow: '0 4px 12px rgba(22, 101, 52, 0.15)',
                minWidth: '110px',
                height: '110px',
                position: 'relative'
              }}>
                {qrCodeSvg ? (
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                  />
                ) : (
                  <div style={{
                    width: '90px',
                    height: '90px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.25rem',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    border: '1px dashed #d1d5db'
                  }}>
                    QR Code
                    <br />
                    <span style={{ fontSize: '0.6rem', marginTop: '0.25rem' }}>
                      Loading...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam Information Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
            border: '2px solid #3b82f6',
            padding: '0.5rem',
            marginBottom: '0.3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px',
              width: '30px',
              height: '30px',
              background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>

            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1e40af',
              margin: 0,
              textShadow: '0 1px 2px rgba(59, 130, 246, 0.1)',
              letterSpacing: '0.025em'
            }}>
              {resultData.term || 'Exam Name'}
            </h2>
            <p style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#3b82f6',
              margin: '0.5rem 0 0 0',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '0.25rem 1rem',
              borderRadius: '9999px',
              display: 'inline-block',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              Academic Year 2025
            </p>
          </div>

          {/* Student Info Card */}
          <div style={{
            ...styles.studentCard,
            padding: '0.3rem',
            marginBottom: '0.3rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            {/* Student Information */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #dbeafe',
                paddingBottom: '0.5rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e40af', margin: 0 }}>
                  Student Information
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
                    color: '#0369a1',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #bae6fd'
                  }}>
                    Class: {studentData.class} {studentData.section ? `- ${studentData.section}` : ''}
                  </span>
                  <span style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
                    color: '#0369a1',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #bae6fd'
                  }}>
                    Roll: {studentData.rollNo || studentData.roll || 'N/A'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: '1 1 40%' }}>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ fontWeight: 600, color: '#374151' }}>Name:</span> <span style={{ color: '#4b5563' }}>{studentData.name || 'N/A'}</span></p>
                  <p><span style={{ fontWeight: 600, color: '#374151' }}>Address:</span> <span style={{ color: '#4b5563' }}>{studentData.address || 'N/A'}</span></p>
                </div>
                <div style={{ flex: '1 1 40%' }}>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ fontWeight: 600, color: '#374151' }}>Father's Name:</span> <span style={{ color: '#4b5563' }}>{studentData.fatherName || 'N/A'}</span></p>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ fontWeight: 600, color: '#374151' }}>DOB:</span> <span style={{ color: '#4b5563' }}>{studentData.dob ? format(new Date(studentData.dob), 'dd MMMM yyyy') : 'N/A'}</span></p>
                </div>
              </div>
            </div>

            {/* Student Photo */}
            <div style={{
              width: '120px',
              height: '150px',
              backgroundColor: 'white',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '2px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {studentData?.photoUrl ? (
                <img
                  src={studentData.photoUrl}
                  alt={studentData.name || 'Student'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.25rem'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: #f3f4f6;
                        color: #9ca3af;
                        font-size: 2rem;
                        font-family: Poppins, sans-serif;
                      ">
                        ${studentData?.name ? studentData.name.trim().charAt(0).toUpperCase() : '?'}
                      </div>
                    `;
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  color: '#9ca3af',
                  fontSize: '2rem',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  {studentData?.name ? studentData.name.trim().charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
          </div>

          {/* Marks Table */}
          <div style={{ overflowX: 'auto', marginBottom: '0.3rem' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'left', width: '25%' }}>Subject</th>
                  {resultData.exam?.config?.evaluationTypes?.map(type => (
                    <th key={type} colSpan="2" style={{ ...styles.th, textAlign: 'center' }}>
                      {type}
                      <div style={{ ...styles.subHeader, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ flex: 1, textAlign: 'center' }}>M.O.</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>F.M.</span>
                      </div>
                    </th>
                  )) || (
                    // Fallback for when evaluationTypes is not available
                    <th colSpan="2" style={{ ...styles.th, textAlign: 'center' }}>
                      Written
                      <div style={{ ...styles.subHeader, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ flex: 1, textAlign: 'center' }}>M.O.</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>F.M.</span>
                      </div>
                    </th>
                  )}
                  <th style={{ ...styles.th, textAlign: 'center' }}>
                    Total
                    <div style={{ ...styles.subHeader, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, textAlign: 'center' }}>M.O.</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>F.M.</span>
                    </div>
                  </th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(resultData.subjectDetails || {}).map(([subject, details]) => (
                  <tr key={subject} style={{ backgroundColor: 'white' }}>
                    <td style={{ ...styles.td, textAlign: 'left', fontWeight: 500 }}>{subject}</td>
                    {resultData.exam?.config?.evaluationTypes?.map(type => {
                      const evaluation = details.evaluations?.find(e => e.type?.toLowerCase() === type.toLowerCase());
                      return (
                        <React.Fragment key={`${subject}-${type}`}>
                          <td style={styles.td}>
                            {evaluation?.marks || '0'}
                          </td>
                          <td style={styles.td}>
                            {evaluation?.maxMarks || '0'}
                          </td>
                        </React.Fragment>
                      );
                    }) || (
                      // Fallback when evaluationTypes is not available
                      <React.Fragment>
                        <td style={styles.td}>
                          {details.evaluations?.[0]?.marks || details.total || '0'}
                        </td>
                        <td style={styles.td}>
                          {details.evaluations?.[0]?.maxMarks || details.max || '0'}
                        </td>
                      </React.Fragment>
                    )}
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontWeight: 600 }}>{details.total || details.obtainedMarks || '0'}</span>
                        <span style={{ color: '#9ca3af' }}>/</span>
                        <span style={{ color: '#6b7280', fontSize: '0.95em' }}>
                          {details.max || details.totalMarks ||
                           (details.evaluations?.reduce((sum, evalItem) => sum + (parseInt(evalItem.maxMarks) || 0), 0) || '0')}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        backgroundColor: details.grade === 'F' ? '#fee2e2' : '#dcfce7',
                        color: details.grade === 'F' ? '#b91c1c' : '#166534',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontWeight: 500
                      }}>
                        {details.grade || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ ...styles.summaryCard, flex: '1 1 48%', padding: '0.5rem', margin: '0.5rem 0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem', borderBottom: '1px solid #dbeafe', paddingBottom: '0.25rem' }}>
                Academic Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: '#4b5563' }}>Total Marks:</span>
                  <span style={{ fontWeight: 600, color: '#1f2937' }}>
                    {resultData.summary?.obtainedMarks || '0'}/{resultData.summary?.totalMarks || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: '#4b5563' }}>Percentage:</span>
                  <span style={{ fontWeight: 600, color: '#1f2937' }}>
                    {resultData.summary?.percentage?.toFixed(2) || '0'}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: '#4b5563' }}>Grade:</span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: resultData.summary?.grade === 'F' ? '#b91c1c' : '#166534',
                    backgroundColor: resultData.summary?.grade === 'F' ? '#fee2e2' : '#dcfce7',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem'
                  }}>
                    {resultData.summary?.grade || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ ...styles.summaryCard, flex: '1 1 48%', padding: '0.5rem', margin: '0.5rem 0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem', borderBottom: '1px solid #dbeafe', paddingBottom: '0.25rem' }}>
                Class Performance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: '#4b5563' }}>Rank:</span>
                  <span style={{ fontWeight: 600, color: '#1f2937' }}>
                    {resultData.summary?.rank ? `#${resultData.summary.rank}` : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: '#4b5563' }}>Total Students:</span>
                  <span style={{ fontWeight: 600, color: '#1f2937' }}>
                    {resultData.summary?.totalStudents || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#4b5563' }}>Result Status:</span>
                  <span style={{
                    fontWeight: 600,
                    color: resultData.summary?.resultStatus === 'Pass' ? '#166534' : '#b91c1c',
                    backgroundColor: resultData.summary?.resultStatus === 'Pass' ? '#dcfce7' : '#fee2e2',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem'
                  }}>
                    {resultData.summary?.resultStatus === 'Pass' ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            {/* Contact Information */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                fontSize: '0.875rem',
                color: '#4b5563'
              }}>
                {schoolinfo.contact?.phone && (
                  <span style={{ fontWeight: 500 }}>
                    📞 {schoolinfo.contact.phone}
                  </span>
                )}
                {schoolinfo.contact?.email && (
                  <span style={{ fontWeight: 500 }}>
                    ✉️ {schoolinfo.contact.email}
                  </span>
                )}
                {schoolinfo.contact?.website && (
                  <span style={{ fontWeight: 500 }}>
                    🌐 {schoolinfo.contact.website}
                  </span>
                )}
              </div>
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintResultModal;
