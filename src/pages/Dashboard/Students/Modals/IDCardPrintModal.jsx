import React, { useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  FaPrint, FaTimes, FaUser, FaUserFriends, FaFemale, 
  FaMapMarkerAlt, FaVenusMars, FaCalendarAlt, FaTint, 
  FaPhone, FaWhatsapp 
} from 'react-icons/fa';
import { format } from 'date-fns';
import { schoolinfo } from "@/shared/schoolInformation";
import QRCode from "qrcode-svg";

const IDCard = ({ student }) => {
  const qrContainerRef = useRef(null);
  const [qrCodeSvg, setQrCodeSvg] = useState("");

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return format(date, 'dd-MMM-yyyy');
    } catch (e) { return dateStr; }
  };

  // Class-wise background colors (8+ distinct soft colors)
  const getClassTheme = (className) => {
    const themes = {
      'LKG': { bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '#fda4af', accent: '#fb7185' }, // Rose
      'UKG': { bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '#7dd3fc', accent: '#38bdf8' }, // Sky
      'I': { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#c4b5fd', accent: '#8b5cf6' },   // Violet
      'II': { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '#fdba74', accent: '#fb923c' },  // Orange
      'III': { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '#67e8f9', accent: '#22d3ee' }, // Cyan
      'IV': { bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: '#fde047', accent: '#eab308' },  // Yellow
      'V': { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '#a5b4fc', accent: '#6366f1' },   // Indigo
      'VI': { bg: 'linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%)', border: '#bef264', accent: '#a3e635' },  // Lime
      'VII': { bg: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)', border: '#d6d3d1', accent: '#78716c' }, // Stone
    };
    return themes[className] || { bg: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '#065f46', accent: '#065f46' };
  };

  const theme = getClassTheme(student.class);

  useEffect(() => {
    if (!student || !qrContainerRef.current) return;
    const qrData = `STUDENT: ${student.studentName}\nROLL: ${student.roll}\nCLASS: ${student.class}\nPHONE: ${student.mobileNumber || 'N/A'}`;
    try {
      const qr = new QRCode({
        content: qrData, padding: 0, width: 30, height: 30,
        color: "#064e3b", background: "#ffffff", ecl: "M",
      });
      setQrCodeSvg(qr.svg());
    } catch (error) { console.error("Error generating QR code:", error); }
  }, [student]);

  useEffect(() => {
    if (qrContainerRef.current && qrCodeSvg) {
      qrContainerRef.current.innerHTML = qrCodeSvg;
    }
  }, [qrCodeSvg]);

  return (
    <div className="id-card-item" style={{
      width: '54mm', height: '86mm', border: `0.5mm solid ${theme.border}`,
      borderRadius: '12px', overflow: 'hidden', display: 'flex',
      flexDirection: 'column', background: theme.bg, position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box',
    }}>
      {/* Design Elements */}
      <div style={{ position: 'absolute', top: '-5mm', right: '-5mm', width: '20mm', height: '20mm', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '50%', zIndex: 0 }}></div>

      {/* Header - White Background for Green Name */}
      <div style={{ position: 'relative', background: 'white', zIndex: 1, padding: '1.2mm 1mm 1.5mm 1mm', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `0.2mm solid ${theme.border}` }}>
        <h2 style={{ fontSize: '9.2pt', color: '#065f46', margin: '0.5mm 0 1.2mm 0', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1, letterSpacing: '0.1mm' }}>{schoolinfo.name}</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0mm', width: '100%', justifyContent: 'center' }}>
          <div style={{ height: '0.3mm', flex: 1, background: 'linear-gradient(to left, #fbbf24, transparent)' }}></div>
          <span style={{ fontSize: '4.2pt', color: '#064e3b', backgroundColor: '#fbbf24', padding: '0.2mm 1.5mm', borderRadius: '30px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2mm', border: '0.1mm solid rgba(0,0,0,0.1)', zIndex: 2 }}>{schoolinfo.branch} branch</span>
          <div style={{ height: '0.3mm', flex: 1, background: 'linear-gradient(to right, #fbbf24, transparent)' }}></div>
        </div>

        {/* Info Row - Pill Chips Style */}
        <div style={{ display: 'flex', gap: '0.8mm', marginTop: '1.5mm', justifyContent: 'center', width: '100%' }}>
          <div style={{ backgroundColor: '#f1f5f9', border: '0.15mm solid #e2e8f0', padding: '0.4mm 1.2mm', borderRadius: '30px', fontSize: '3.2pt', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap' }}>RUN BY: {schoolinfo.runBy}</div>
          <div style={{ backgroundColor: '#f1f5f9', border: '0.15mm solid #e2e8f0', padding: '0.4mm 1.2mm', borderRadius: '30px', fontSize: '3.2pt', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap' }}>ESTD: {schoolinfo.estd}</div>
          <div style={{ backgroundColor: '#f1f5f9', border: '0.15mm solid #e2e8f0', padding: '0.4mm 1.2mm', borderRadius: '30px', fontSize: '3.2pt', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap' }}>REG: {schoolinfo.regNumber}</div>
        </div>

        <p style={{ fontSize: '3.5pt', color: '#64748b', margin: '1mm 0 0 0', textAlign: 'center', fontWeight: 600 }}>{schoolinfo.address}</p>
      </div>

      {/* Photo and Identity Row */}
      <div style={{ display: 'flex', padding: '1.5mm 3.5mm 1.8mm 3.5mm', gap: '3.5mm', zIndex: 2, position: 'relative', alignItems: 'center' }}>
        <div style={{ width: '20mm', height: '23mm', border: `1.2px solid ${theme.accent}`, borderRadius: '4px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', flexShrink: 0 }}>
          {student.photoUrl ? <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, backgroundColor: '#fdfdfd' }}><FaUser size={22} /></div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8mm' }}>
          <div style={{ fontSize: '3.6pt', color: theme.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1mm' }}>Student Name</div>
          <h3 style={{ fontSize: '9.2pt', fontWeight: 900, color: '#064e3b', textTransform: 'uppercase', lineHeight: 1.2, margin: 0, letterSpacing: '-0.1mm' }}>{student.studentName}</h3>
          <div style={{ display: 'flex', gap: '1.2mm', marginTop: '1.2mm' }}>
             <div style={{ flex: 1, border: `0.3mm solid ${theme.accent}`, color: theme.accent, padding: '0.5mm', borderRadius: '4px', textAlign: 'center', backgroundColor: 'white' }}>
                <div style={{ fontSize: '3pt', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Roll</div>
                <div style={{ fontSize: '7pt', fontWeight: 900 }}>{student.roll}</div>
             </div>
             <div style={{ flex: 1, backgroundColor: theme.accent, color: 'white', padding: '0.5mm', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '3pt', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Class</div>
                <div style={{ fontSize: '7pt', fontWeight: 900 }}>{student.class}</div>
             </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div style={{ padding: '0 3.5mm 1mm 3.5mm', flex: 1, zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '1.2mm 4mm' }}>
          {/* Column 1: Text Heavy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
            <DetailRow icon={<FaUserFriends />} label="Father's Name" value={student.fatherName} accent={theme.accent} />
            <DetailRow icon={<FaFemale />} label="Mother's Name" value={student.motherName} accent={theme.accent} />
            <DetailRow icon={<FaMapMarkerAlt />} label="Address" value={student.address} multiLine accent={theme.accent} />
          </div>

          {/* Column 2: Short Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
            <DetailRow icon={<FaVenusMars />} label="Gender" value={student.gender} accent={theme.accent} />
            <DetailRow icon={<FaCalendarAlt />} label="DOB" value={formatDate(student.dob)} accent={theme.accent} />
            <DetailRow icon={<FaTint />} label="Blood" value={student.bloodGroup} accent={theme.accent} />
          </div>
        </div>

        {/* Mobile Highlight Row */}
        <div style={{ 
          marginTop: 'auto', 
          backgroundColor: 'white', 
          padding: '0.8mm 3mm', 
          borderRadius: '5px', 
          border: `0.3mm solid ${theme.accent}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
            <span style={{ fontSize: '4pt', color: theme.accent, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1mm' }}>Mobile Number</span>
          </div>
          <span style={{ fontSize: '7.5pt', color: '#064e3b', fontWeight: 950 }}>{student.mobileNumber || '---'}</span>
        </div>
      </div>

      {/* Signature & QR Section */}
      <div style={{ position: 'relative', padding: '1mm 3.5mm 1mm 3.5mm', background: 'white', zIndex: 1, marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div ref={qrContainerRef} style={{ width: '9mm', height: '9mm', backgroundColor: 'white', padding: '0.4mm', borderRadius: '3px', border: `0.1mm solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6mm' }}>
            <div style={{ width: '22mm', height: '0.3mm', backgroundColor: '#064e3b', margin: '0 auto' }}></div>
            <p style={{ fontSize: '4.5pt', fontWeight: 900, color: '#064e3b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.1mm' }}>Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Full Width Bottom Contact Bar */}
      <div style={{ 
        width: '100%', 
        backgroundColor: '#065f46', 
        padding: '1mm 0', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '2mm',
        color: 'white',
        zIndex: 1
      }}>
        <FaPhone size={4.5} />
        <span style={{ fontSize: '4.8pt', fontWeight: 900, letterSpacing: '0.2mm' }}>{schoolinfo.contact.phone}</span>
        <span style={{ fontSize: '3.5pt', opacity: 0.7 }}>•</span>
        <span style={{ fontSize: '4.2pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1mm' }}>{schoolinfo.contact.website.replace('https://', '')}</span>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value, multiLine = false, accent }) => (
  <div style={{ overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8mm', fontSize: '3.5pt', color: accent, textTransform: 'uppercase', fontWeight: 800, lineHeight: 1, letterSpacing: '0.1mm' }}>
      {icon && <span style={{ fontSize: '3.8pt' }}>{icon}</span>}
      {label}
    </div>
    <div style={{ 
      fontSize: '6.2pt', 
      color: '#064e3b', 
      fontWeight: 700, 
      whiteSpace: multiLine ? 'normal' : 'nowrap', 
      maxHeight: multiLine ? '7.5mm' : 'auto',
      overflow: 'hidden', 
      textOverflow: 'ellipsis', 
      marginTop: '0.2mm',
      lineHeight: 1.1
    }} title={value}>{value || '---'}</div>
  </div>
);

export default function IDCardPrintModal({ isOpen, onClose, students = [], selectedClass }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `ID Cards - ${selectedClass}`,
    pageStyle: `
      @page { size: A4 landscape; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; }
        .print-area { display: block !important; }
        .page-break { page-break-after: always; }
      }
    `,
  });

  if (!isOpen) return null;

  const pages = [];
  for (let i = 0; i < students.length; i += 10) {
    pages.push(students.slice(i, i + 10));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-[95vw] h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="px-10 py-6 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Print ID Cards</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded uppercase tracking-wider">{selectedClass}</span>
              <span className="text-xs font-bold text-gray-400">{students.length} Students Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handlePrint()} className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all font-black shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 group">
              <FaPrint size={16} className="group-hover:rotate-12 transition-transform" /> START PRINTING
            </button>
            <button onClick={onClose} className="p-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-12 bg-[#f1f5f9] dark:bg-black/20">
          <div ref={componentRef} className="mx-auto print-area" style={{ width: 'fit-content' }}>
            {pages.map((pageStudents, pageIdx) => (
              <div key={pageIdx} style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 54mm)',
                gridTemplateRows: 'repeat(2, 86mm)', gap: '3mm',
                width: 'fit-content', padding: '10mm 0 0 0',
                boxSizing: 'border-box', pageBreakAfter: 'always',
                backgroundColor: 'transparent', position: 'relative',
                marginBottom: '50px'
              }} className="page-break">
                {pageStudents.map((stu, idx) => (
                  <div key={idx} style={{ backgroundColor: 'white', borderRadius: '6px', shadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <IDCard student={stu} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
