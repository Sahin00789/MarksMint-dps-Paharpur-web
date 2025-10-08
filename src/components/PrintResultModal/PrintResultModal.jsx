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
      school :"DINA PUBLIC SCHOOL - PAHARPUR",
      class: studentData?.class || '',
      roll: studentData?.roll || '',
      exam: resultData?.exam?.name || '',
      academicYear: resultData?.academicYear || '',
    };

    const qrCode = new QRCode({
      content: JSON.stringify(studentInfo),
      padding: 2,
      width: 80,
      height: 80,
      color: '#000000',
      background: '#ffffff',
      ecl: 'M' // Error correction level: L, M, Q, H
    }).svg();
    
    setQrCodeSvg(qrCode);
  }, [studentData, resultData]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { 
        size: A4;
        margin: 10mm 15mm 15mm 15mm;
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
      padding: '1.5rem',
      marginTop: '2rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      margin: '0.75rem 0',
      fontSize: '0.9rem',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
    },
    th: {
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      padding: '0.6rem 0.7rem',
      textAlign: 'center',
      fontWeight: 600,
      color: '#1f2937',
      verticalAlign: 'middle',
      lineHeight: '1.3'
    },
    td: {
      border: '1px solid #e5e7eb',
      padding: '0.5rem 0.6rem',
      textAlign: 'center',
      color: '#4b5563',
      verticalAlign: 'middle',
      lineHeight: '1.4'
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
        <div ref={printRef} style={{ padding: '1.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              {schoolinfo.name || 'School Name'}
            </h1>
            <p style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              {schoolinfo.address || 'School Address'}
            </p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6', marginTop: '0.5rem' }}>
              {resultData.exam?.name || 'Exam Name'} - Academic Year {resultData.academicYear || '2024-2025'}
            </h2>
          </div>

          {/* Student Info Card */}
          <div style={{...styles.studentCard, padding: '0.75rem', marginBottom: '0.75rem', position: 'relative'}}>
            {/* QR Code - Moved below the header */}
            <div style={{ 
              position: 'absolute', 
              top: '50px',
              right: '20px',
              backgroundColor: 'white',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1
            }}>
              {qrCodeSvg && (
                <div 
                  style={{ width: '60px', height: '60px' }}
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
              )}
             
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem', 
              borderBottom: '1px solid #dbeafe', 
              paddingBottom: '0.5rem',
              position: 'relative',
              zIndex: 2
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e40af', margin: 0 }}>
                Student Information
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  Class: {studentData.class} {studentData.section ? `- ${studentData.section}` : ''}
                </span>
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  Roll: {studentData.roll || 'N/A'}
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

          {/* Marks Table */}
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
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
                  ))}
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
                      const evaluation = details.evaluations?.find(e => e.type.toLowerCase() === type.toLowerCase());
                      return (
                        <React.Fragment key={`${subject}-${type}`}>
                          <td style={styles.td}>
                            {evaluation?.marks || '0'}
                          </td>
                          <td style={styles.td}>
                            {evaluation?.maxMarks || evaluation?.fullMarks || '0'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontWeight: 600 }}>{details.obtainedMarks || details.total || '0'}</div>
                        <div style={{ 
                          borderTop: '1px solid #e5e7eb', 
                          paddingTop: '0.2rem',
                          fontSize: '0.8rem',
                          color: '#6b7280'
                        }}>
                          {details.maxMarks || details.totalMarks || 
                           (details.evaluations?.reduce((sum, evalItem) => sum + (parseInt(evalItem.maxMarks) || 0), 0) || '0')}
                        </div>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '2rem' }}>
            <div style={{ ...styles.summaryCard, flex: '1 1 48%', padding: '0.75rem', margin: '0.5rem 0' }}>
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

            <div style={{ ...styles.summaryCard, flex: '1 1 48%', padding: '0.75rem', margin: '0.5rem 0' }}>
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
                    color: resultData.summary?.isPassed ? '#166534' : '#b91c1c',
                    backgroundColor: resultData.summary?.isPassed ? '#dcfce7' : '#fee2e2',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem'
                  }}>
                    {resultData.summary?.isPassed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280', 
            fontStyle: 'italic', 
            textAlign: 'center', 
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            This is a computer generated document and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintResultModal;
