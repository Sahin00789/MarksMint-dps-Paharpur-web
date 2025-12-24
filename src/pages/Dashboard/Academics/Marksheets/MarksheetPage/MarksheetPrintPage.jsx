import React, { useEffect, useRef, useState, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import QRCode from 'qrcode-svg';
import { format } from 'date-fns';
import { schoolinfo } from '@/shared/schoolInformation';

// --- Inline Helper Components for Portability ---

const CircularProgress = ({ value, color, size = 50, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>{Math.round(value)}%</div>
    </div>
  );
};

const MarksheetPrintPage = ({
  processedStudent = {}, 
  academicYear = '2025'
}) => {
  const coScholastic = processedStudent.coScholastic || {
    workEducation: { grade: 'N/A' },
    artEducation: { grade: 'N/A' },
    healthAndPhysical: { grade: 'N/A' },
    discipline: { grade: 'N/A' }
  };

  const qrContainerRef = useRef(null);
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const student = {
    ...(processedStudent?.student || {}),
    rollNo: processedStudent?.student?.rollNo || processedStudent?.rollNo || 'N/A'
  };

  const attendanceSummary = {
    attendancePercentage: processedStudent?.attendanceSummary?.attendancePercentage || 0,
    getAttendancePercentage: function() { return Math.round(this.attendancePercentage) || 0; }
  };

  const overallSummary = {
    totalMarks: processedStudent?.overallSummary?.totalMarks || 0,
    obtainedMarks: processedStudent?.overallSummary?.obtainedMarks || 0,
    percentage: processedStudent?.overallSummary?.percentage || 0,
    grade: processedStudent?.overallSummary?.grade || 'N/A',
    rank: processedStudent?.overallSummary?.rank || 0,
    totalStudents: processedStudent?.overallSummary?.totalStudents || 1,
    resultStatus: processedStudent?.overallSummary?.resultStatus || 'Pass'
  };

  useEffect(() => {
    if (!processedStudent || !qrContainerRef.current) return;
    const qrData = JSON.stringify({
      school: schoolinfo?.name || 'School Name',
      name: student.studentName || 'Student',
      class: student.class || 'Class',
      roll: student.rollNo || 'N/A',
      result: overallSummary.resultStatus,
      percentage: overallSummary.percentage
    });

    try {
      qrContainerRef.current.innerHTML = '';
      const qr = new QRCode({
        content: qrData,
        padding: 2,
        width: 115,
        height: 115,
        color: '#114e28ff',
        background: '#ffffff',
        ecl: 'M'
      });
      setQrCodeSvg(qr.svg());
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [processedStudent]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted && qrContainerRef.current && qrCodeSvg) {
      qrContainerRef.current.innerHTML = qrCodeSvg;
    }
  }, [qrCodeSvg, isMounted]);

  const processedExamResults = processedStudent?.marks ? Object.entries(processedStudent.marks).map(([examTerm, examData]) => ({
    term: examTerm,
    subjectDetails: examData.subjectDetails || {}
  })) : [];

  if (!processedStudent || Object.keys(processedStudent).length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // --- Styles ---
  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;600;700&display=swap');
    @media print {
      @page { 
        size: A4; 
        margin: 8mm !important; 
      }
      body { 
        margin: 0 !important; 
        padding: 0 !important; 
        line-height: normal !important;
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
      }
      .no-print { display: none !important; }
      .print-page {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        width: 194mm !important;
        height: 281mm !important;
        max-height: 281mm !important;
        overflow: hidden !important;
        position: relative !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        break-inside: avoid !important;
        border-radius: 12px !important;
        -webkit-print-color-adjust: exact !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  return (
    <div className="print-page" style={{
      width: '194mm',
      height: '281mm',
      maxHeight: '281mm',
      margin: '20px auto',
      backgroundColor: '#fff',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Poppins", sans-serif',
      color: '#1e293b',
      boxSizing: 'border-box',
      borderRadius: '12px',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)'
    }}>
      <style>{printStyles}</style>

      {/* Decorative Borders (Restored Raised Design) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        border: '3px solid #166534', 
        borderBottomWidth: '15px', // "Raised" bottom
        borderRadius: '16px', 
        pointerEvents: 'none', zIndex: 10,
        boxShadow: 'inset 0 0 0 3px #fff, inset 0 0 0 5px #22c55e, inset 0 0 0 6px #fff'
      }}></div>
      <div style={{ 
        position: 'absolute', top: '25px', left: '25px', right: '25px', bottom: '25px', 
        border: '1px solid rgba(22, 163, 74, 0.12)', 
        borderRadius: '8px', 
        pointerEvents: 'none', zIndex: 10 
      }}></div>

      {/* Tiled Watermark Background (Readability Improved & Modern Font) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' font-weight='700' fill='rgba(22, 163, 74, 0.08)' text-anchor='middle' transform='rotate(-45 90 90)'%3EDINA PUBLIC SCHOOL%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}></div>

      <div style={{ padding: '6mm 8mm 4mm 8mm', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        
        {/* Header Section */}
        <div style={{ 
          position: 'relative', // Changed to relative for absolute children
          padding: '10px 18px', 
          background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.8) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(240, 253, 244, 0.8) 100%)',
          borderRadius: '10px',
          borderBottom: '2px solid #dcfce7',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          zIndex: 1,
          minHeight: '130px', // Ensure consistent height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
             {/* School Info */}
             <div style={{ flex: 1, paddingRight: '150px' }}>
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '42px', color: '#166534', fontFamily: '"Roboto Slab", serif', fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: '-1px', textTransform: 'uppercase' }}>
                    DINA PUBLIC SCHOOL
                  </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
                  <div style={{ height: '1.5px', background: 'linear-gradient(to right, transparent, #166534)', flex: 1 }}></div>
                  <span style={{ 
                    backgroundColor: '#166534', 
                    color: '#fff', 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    padding: '2px 12px', 
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    whiteSpace: 'nowrap'
                  }}>
                    Paharpur branch
                  </span>
                  <div style={{ height: '1.5px', background: 'linear-gradient(to left, transparent, #166534)', flex: 1 }}></div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 500, marginBottom: '10px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMapMarkerAlt size={12} color="#16a34a" />
                    <span>Paharpur, Banshihari, Dakshin Dinajpur, 733125</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ background: '#f0fdf4', padding: '3px 10px', borderRadius: '4px', border: '1px solid #dcfce7', fontSize: '11px' }}>
                        <span style={{ color: '#166534', fontWeight: 700 }}>REG:</span> <span style={{ color: '#334155', fontWeight: 600 }}>06608/IV</span>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '3px 10px', borderRadius: '4px', border: '1px solid #dcfce7', fontSize: '11px' }}>
                        <span style={{ color: '#166534', fontWeight: 700 }}>EST:</span> <span style={{ color: '#334155', fontWeight: 600 }}>2022</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#166534', fontWeight: 800, background: '#f0fdf4', padding: '3px 12px', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                      Run By - M.M.D.C.T.
                    </div>
                  </div>
                </div>
             </div>
             
             {/* QR Code - Absolutely Positioned */}
             <div style={{ 
               position: 'absolute', 
               right: '18px', 
               top: '50%', 
               transform: 'translateY(-50%)' 
             }}>
                <div style={{ 
                  width: '130px', 
                  height: '130px', 
                  padding: '8px', 
                  background: '#fff', 
                  border: '2px solid #166534', 
                  borderRadius: '12px', 
                  boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <div ref={qrContainerRef} style={{ width: '115px', height: '115px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
                </div>
             </div>
        </div>

        {/* Title Banner */}
        <div style={{ 
          textAlign: 'center', background: 'linear-gradient(90deg, #15803d, #22c55e, #15803d)', 
          padding: '4px 0', borderRadius: '4px', color: '#fff', fontWeight: 700, fontSize: '14px', 
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          Academic Progress Report - {academicYear}
        </div>

        {/* Student Grid */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
           {/* Photo */}
           <div style={{ width: '90px', height: '110px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {student.photoUrl ? <img src={student.photoUrl} alt="S" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaUser color="#cbd5e1" size={32} />}
           </div>
           
           {/* Details Grid */}
           <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 20px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <div style={{ borderLeft: '3px solid #166534', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '1px' }}>Student Name</div>
                  <div style={{ fontSize: '14px', color: '#166534', fontWeight: 800 }}>{student.studentName || student.name || 'N/A'}</div>
               </div>
               <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '1px' }}>Class & Section</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>{student.classInfo?.name || student.class || 'N/A'}</div>
               </div>
               <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '1px' }}>Roll No</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 800 }}>{student.rollNo}</div>
               </div>
               <div style={{ borderLeft: '3px solid #64748b', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '1px' }}>Parent / Guardian</div>
                  <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>{student.fatherName || 'N/A'}</div>
               </div>
               <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '1px' }}>Date of Birth</div>
                  <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>{student.dob ? format(new Date(student.dob), 'dd MMM yyyy') : 'N/A'}</div>
               </div>
               <div style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '1px' }}>Address</div>
                  <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: 500, lineHeight: 1.1 }}>{student.address || 'N/A'}</div>
               </div>
           </div>
        </div>

        {/* Academic Table */}
        <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #166534' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              {/* Row 1: Exam Terms */}
              <tr style={{ backgroundColor: '#166534', color: '#fff' }}>
                <th rowSpan={3} style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 800, width: '25%', fontSize: '12px', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>SUBJECTS</th>
                {processedExamResults.map((exam, idx) => {
                   // Calculate colSpan based on unique evaluation types across all subjects in this term
                   const evalTypes = new Set();
                   Object.values(exam.subjectDetails).forEach(subject => {
                     subject.evaluations?.forEach(ev => evalTypes.add(ev.type));
                   });
                   const colSpan = Math.max(1, evalTypes.size) * 2;
                   const parts = exam.term.split(' ');
                   
                   return (
                    <th key={idx} colSpan={colSpan} style={{ textAlign: 'center', padding: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                       <div style={{ lineHeight: 1.1 }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{parts[0]}</span><br/>
                          <span style={{ fontSize: '8px', fontWeight: 400, opacity: 0.9 }}>{parts.slice(1).join(' ')}</span>
                       </div>
                    </th>
                   );
                })}
                <th rowSpan={3} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>SUBJECT<br/><span style={{ fontSize: '9px', fontWeight: 400 }}>TOTAL</span></th>
                <th rowSpan={3} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>%</th>
                <th rowSpan={3} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>GRADE</th>
              </tr>

              {/* Row 2: Evaluation Types (Written, Oral, etc.) */}
              <tr style={{ backgroundColor: '#166534', color: '#fff', fontSize: '9px' }}>
                {processedExamResults.map((exam, idx) => {
                   const evalTypes = Array.from(new Set(Object.values(exam.subjectDetails).flatMap(s => s.evaluations?.map(ev => ev.type) || [])));
                   if (evalTypes.length === 0) return <th key={idx} colSpan={2} style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '4px' }}>Marks</th>;
                   return evalTypes.map((type, tIdx) => (
                     <th key={`${idx}-${tIdx}`} colSpan={2} style={{ 
                       textAlign: 'center', padding: '4px', 
                       borderLeft: tIdx === 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                       borderBottom: '1px solid rgba(255,255,255,0.2)',
                       fontWeight: 700, textTransform: 'uppercase'
                     }}>
                       {type}
                     </th>
                   ));
                })}
              </tr>

              {/* Row 3: MO/FM Headers */}
              <tr style={{ backgroundColor: '#f0fdf4', fontSize: '9px', color: '#166534' }}>
                {processedExamResults.map((exam, idx) => {
                   const evalTypes = Array.from(new Set(Object.values(exam.subjectDetails).flatMap(s => s.evaluations?.map(ev => ev.type) || [])));
                   const headers = evalTypes.length === 0 ? [1] : evalTypes;
                   return headers.map((_, hIdx) => (
                     <Fragment key={`${idx}-${hIdx}`}>
                       <th style={{ padding: '4px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #bbf7d0', borderLeft: hIdx === 0 ? '1px solid #bbf7d0' : 'none' }}>MO</th>
                       <th style={{ padding: '4px', textAlign: 'center', fontWeight: 600, color: '#64748b', borderRight: '1px solid #bbf7d0' }}>FM</th>
                     </Fragment>
                   ));
                })}
              </tr>
            </thead>
            <tbody>
              {processedExamResults.length > 0 && Object.keys(processedExamResults[0].subjectDetails).slice(0, 10).map((subjectName, index) => {
                 const subjectSummary = processedStudent?.subjectwiseSummary?.[subjectName];
                 const isEven = index % 2 === 0;
                 return (
                   <tr key={subjectName} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isEven ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{subjectName}</td>
                      {processedExamResults.map((exam, i) => {
                         const evalTypes = Array.from(new Set(Object.values(exam.subjectDetails).flatMap(s => s.evaluations?.map(ev => ev.type) || [])));
                         const subjectInfo = exam.subjectDetails[subjectName];
                         
                         if (evalTypes.length === 0) {
                           return (
                             <Fragment key={i}>
                               <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, color: '#166534', borderLeft: '1px solid #f1f5f9' }}>{subjectInfo?.total || '-'}</td>
                               <td style={{ textAlign: 'center', padding: '6px', color: '#94a3b8', fontSize: '9px', borderLeft: '1px solid #f1f5f9' }}>{subjectInfo?.max || '-'}</td>
                             </Fragment>
                           );
                         }

                         return evalTypes.map((type, tIdx) => {
                           const evaluation = subjectInfo?.evaluations?.find(ev => ev.type === type);
                           return (
                             <Fragment key={`${i}-${tIdx}`}>
                               <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, color: '#166534', borderLeft: '1px solid #f1f5f9' }}>{evaluation?.marks ?? '-'}</td>
                               <td style={{ textAlign: 'center', padding: '6px', color: '#94a3b8', fontSize: '9px', borderLeft: '1px solid #f1f5f9' }}>{evaluation?.maxMarks ?? '-'}</td>
                             </Fragment>
                           );
                         });
                      })}
                      <td style={{ textAlign: 'center', padding: '6px', fontWeight: 800, color: '#1e293b', background: isEven ? '#f0fdf4' : '#ecfccb', borderLeft: '1px solid #f1f5f9' }}>
                        {Math.round(subjectSummary?.obtainedTotal || 0)}
                        <span style={{ fontSize: '9px', fontWeight: 400, color: '#64748b', marginLeft: '2px' }}>/ {subjectSummary?.maxTotal || 0}</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, color: '#166534', borderLeft: '1px solid #f1f5f9' }}>{Math.round(subjectSummary?.percentage || 0)}%</td>
                      <td style={{ textAlign: 'center', padding: '6px', borderLeft: '1px solid #f1f5f9' }}>
                         <span style={{ 
                           padding: '2px 6px', 
                           borderRadius: '4px', 
                           background: '#166534', 
                           color: '#fff', 
                           fontWeight: 800, 
                           fontSize: '9px',
                           boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                         }}>
                            {subjectSummary?.grade || '-'}
                         </span>
                      </td>
                   </tr>
                 );
              })}
              {/* Overall Total Row */}
              <tr style={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: '11px', borderTop: '2px solid #166534' }}>
                <td style={{ padding: '12px 10px', borderRight: '1px solid #bbf7d0' }}>GRAND TOTAL</td>
                {processedExamResults.map((exam, idx) => {
                   const evalTypes = new Set();
                   Object.values(exam.subjectDetails).forEach(subject => {
                     subject.evaluations?.forEach(ev => evalTypes.add(ev.type));
                   });
                   const examTotal = Object.values(exam.subjectDetails).reduce((sum, s) => sum + (s.total || 0), 0);
                   const examMax = Object.values(exam.subjectDetails).reduce((sum, s) => sum + (s.max || 0), 0);
                   
                   const colSpan = Math.max(1, evalTypes.size) * 2;
                   return (
                     <td key={idx} colSpan={colSpan} style={{ textAlign: 'center', padding: '10px', borderLeft: '1px solid #bbf7d0' }}>
                       <span style={{ fontWeight: 800 }}>{Math.round(examTotal)}</span> <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>/ {Math.round(examMax)}</span>
                     </td>
                   );
                })}
                <td style={{ textAlign: 'center', padding: '10px', borderLeft: '1px solid #bbf7d0' }}>
                  <span style={{ fontWeight: 800 }}>{Math.round(overallSummary.obtainedMarks)}</span> <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>/ {Math.round(overallSummary.totalMarks)}</span>
                </td>
                <td style={{ textAlign: 'center', padding: '10px', borderLeft: '1px solid #bbf7d0' }}>{Math.round(overallSummary.percentage)}%</td>
                <td style={{ textAlign: 'center', padding: '10px', borderLeft: '1px solid #bbf7d0' }}>{overallSummary.grade}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Co-Scholastic (Horizontal Bar) */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', padding: '8px 15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', marginRight: '10px', whiteSpace: 'nowrap' }}>CO-SCHOLASTIC & ATTRIBUTES:</div>
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between' }}>
               {[
                 { key: 'workEducation', label: 'Work Education' },
                 { key: 'artEducation', label: 'Art Education' },
                 { key: 'healthAndPhysical', label: 'Physical Education' },
                 { key: 'discipline', label: 'Discipline' }
               ].map((item, idx) => {
                  const val = coScholastic[item.key];
                  const grade = val?.grade || 'N/A';
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{item.label}:</span>
                       <span style={{ 
                         fontSize: '11px', 
                         fontWeight: 700, 
                         color: grade === 'AB' ? '#dc2626' : '#1e293b' 
                       }}>
                         {grade === 'AB' ? 'AB' : grade}
                       </span>
                    </div>
                  );
               })}
            </div>
        </div>

        {/* Summary Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '10px' }}>
            {/* Attendance */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ffffff)', border: '1.5px solid #86efac', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
               <CircularProgress value={attendanceSummary.getAttendancePercentage()} color="#22c55e" size={42} strokeWidth={4} />
               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Attendance</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                     {processedStudent?.attendanceSummary?.presentDays || 0}/{processedStudent?.attendanceSummary?.totalDays || 0}
                  </div>
               </div>
            </div>

            {/* Overall Percentage */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #ffffff)', border: '1.5px solid #93c5fd', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
               <CircularProgress value={overallSummary.percentage} color="#3b82f6" size={42} strokeWidth={4} />
               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Overall</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                     {Math.round(overallSummary.obtainedMarks)}/{Math.round(overallSummary.totalMarks)}
                  </div>
               </div>
            </div>

            {/* Overall Grade Card */}
            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ffffff)', border: '1.5px solid #c4b5fd', borderRadius: '10px', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
               <div style={{ fontSize: '9px', color: '#5b21b6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Final Grade</div>
               <div style={{ fontSize: '20px', fontWeight: 800, color: '#4c1d95', lineHeight: 1 }}>{overallSummary.grade}</div>
            </div>

            {/* Rank */}
            <div style={{ background: 'linear-gradient(135deg, #fef3c7, #ffffff)', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
               <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Class Rank</div>
               <div style={{ fontSize: '20px', fontWeight: 800, color: '#78350f', lineHeight: 1 }}>
                  {overallSummary.rank}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#a16207' }}> / {overallSummary.totalStudents}</span>
               </div>
            </div>

            {/* Result */}
            <div style={{ background: overallSummary.resultStatus === 'Pass' ? 'linear-gradient(135deg, #dcfce7, #ffffff)' : 'linear-gradient(135deg, #fee2e2, #ffffff)', border: `1.5px solid ${overallSummary.resultStatus === 'Pass' ? '#86efac' : '#fca5a5'}`, borderRadius: '10px', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
               <div style={{ fontSize: '9px', color: overallSummary.resultStatus === 'Pass' ? '#166534' : '#991b1b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Result</div>
               <div style={{ fontSize: '18px', fontWeight: 800, color: overallSummary.resultStatus === 'Pass' ? '#15803d' : '#dc2626', lineHeight: 1 }}>{overallSummary.resultStatus}</div>
            </div>
        </div>

        {/* Footer / Signatures */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '40px', marginBottom: '15px' }}>
             {['Class Teacher', 'Principal', 'Parent / Guardian'].map((role, idx) => (
               <div key={idx} style={{ flex: 1 }}>
                  <div style={{ height: '45px', borderBottom: '1.5px solid #cbd5e1', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{role}</div>
               </div>
             ))}
          </div>

           {/* Contact Footer */}
           <div style={{ padding: '8px 15px', borderRadius: '6px', marginTop: '10px', marginBottom: '10px', border: '1px solid #166534', backgroundColor: '#f0fdf4' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '10px' }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                 </svg>
                 <span style={{ fontWeight: 700 }}>+91 6295884463</span>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '10px' }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                   <polyline points="22,6 12,13 2,6"></polyline>
                 </svg>
                 <span style={{ fontWeight: 700 }}>dinapublicschool.paharpur@gmail.com</span>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '10px' }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="2" y1="12" x2="22" y2="12"></line>
                   <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                 </svg>
                 <span style={{ fontWeight: 700 }}>dpspaharpur.web.app/</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
  
export default MarksheetPrintPage;
