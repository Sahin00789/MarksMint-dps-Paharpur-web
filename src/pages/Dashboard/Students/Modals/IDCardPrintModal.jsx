import React, { useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  FaPrint, FaTimes, FaUser, FaUserFriends, FaFemale,
  FaMapMarkerAlt, FaVenusMars, FaCalendarAlt, FaTint, FaPhone,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { schoolinfo } from "@/shared/schoolInformation";
import QRCode from "qrcode-svg";

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  g900: '#052e16', g800: '#064e3b', g700: '#065f46',
  g600: '#047857', g500: '#059669', g400: '#34d399',
  g200: '#a7f3d0', g100: '#d1fae5', g50:  '#ecfdf5',
  t600: '#0d9488', t300: '#5eead4',
  a500: '#f59e0b', a200: '#fde68a',
  i600: '#4338ca', i300: '#a5b4fc', i100: '#e0e7ff',
  r400: '#fb7185',
};

// ─── Security Background Pattern (guilloché-style, multi-layer) ────────────
// Layer 1: fine diagonal hatch lines
const SEC_HATCH = `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='8' x2='8' y2='0' stroke='%23059669' stroke-opacity='0.07' stroke-width='0.5'/%3E%3C/svg%3E")`;
// Layer 2: rhombus / diamond grid
const SEC_DIAMOND = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='10,1 19,10 10,19 1,10' fill='none' stroke='%230d9488' stroke-opacity='0.07' stroke-width='0.5'/%3E%3C/svg%3E")`;
// Layer 3: micro rosette / concentric rings at intervals
const SEC_ROSETTE = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='8' fill='none' stroke='%23059669' stroke-opacity='0.06' stroke-width='0.5'/%3E%3Ccircle cx='20' cy='20' r='14' fill='none' stroke='%230d9488' stroke-opacity='0.05' stroke-width='0.4'/%3E%3Ccircle cx='20' cy='20' r='2' fill='none' stroke='%234338ca' stroke-opacity='0.06' stroke-width='0.5'/%3E%3C/svg%3E")`;
// Layer 4: hex lattice watermark
const SEC_HEX = `url("data:image/svg+xml,%3Csvg width='30' height='26' viewBox='0 0 30 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='15,1 28,8 28,18 15,25 2,18 2,8' fill='none' stroke='%23065f46' stroke-opacity='0.05' stroke-width='0.5'/%3E%3C/svg%3E")`;
// Combined
const DOT_PATTERN = [SEC_HEX, SEC_ROSETTE, SEC_DIAMOND, SEC_HATCH].join(', ');

// ─── Detail Row ─────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value, multiLine = false, iconColor = C.g600, valueFontSize = '6.5pt' }) => (
  <div style={{ overflow: 'hidden' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.7mm',
      fontSize: '3.5pt', fontWeight: 800, color: iconColor,
      textTransform: 'uppercase', letterSpacing: '0.1mm', lineHeight: 1,
    }}>
      <span style={{ fontSize: '3.8pt' }}>{icon}</span>{label}
    </div>
    <div style={{
      fontSize: valueFontSize, fontWeight: 700, color: C.g900,
      lineHeight: 1.15, marginTop: '0.3mm',
      whiteSpace: multiLine ? 'normal' : 'nowrap',
      maxHeight: multiLine ? '9mm' : 'auto',
      overflow: 'hidden', textOverflow: 'ellipsis',
    }} title={value}>{value || '—'}</div>
  </div>
);

// ─── ID Card ────────────────────────────────────────────────────────────────
const IDCard = ({ student }) => {
  const qrRef = useRef(null);
  const [qrSvg, setQrSvg] = useState('');

  const fmt = (d) => {
    if (!d) return 'N/A';
    try { const dt = new Date(d); return isNaN(dt) ? d : format(dt, 'dd MMM yy'); }
    catch { return d; }
  };

  useEffect(() => {
    if (!student) return;
    try {
      const qr = new QRCode({
        content: `DPS-${student.class}-${student.roll}-${student.studentName}`,
        padding: 2,
        width: 256,
        height: 256,
        color: C.g800,
        background: '#ffffff',
        ecl: 'M',
      });
      setQrSvg(qr.svg());
    } catch (e) { console.error('QR error', e); }
  }, [student]);

  useEffect(() => {
    if (!qrRef.current || !qrSvg) return;
    qrRef.current.innerHTML = qrSvg;
    const s = qrRef.current.querySelector('svg');
    if (s) {
      // Remove fixed width/height so CSS controls sizing
      s.removeAttribute('width');
      s.removeAttribute('height');
      // Ensure viewBox is present for proper scaling
      if (!s.getAttribute('viewBox')) {
        s.setAttribute('viewBox', '0 0 256 256');
      }
      s.style.display = 'block';
      s.style.width = '100%';
      s.style.height = '100%';
    }
  }, [qrSvg]);

  return (
    <div style={{
      width: '54mm', height: '86mm',
      background: `${DOT_PATTERN}, linear-gradient(170deg, #f0fdf4 0%, #ecfdf5 55%, #f0fdfa 100%)`,
      borderRadius: '10px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      position: 'relative', fontFamily: "'Inter', system-ui, sans-serif",
      boxSizing: 'border-box',
      border: `0.5mm solid ${C.g400}`,
      boxShadow: `
        0 3mm 10mm rgba(5,150,105,0.18),
        inset 0 0.5mm 1mm rgba(255,255,255,0.9),
        inset 0 -0.5mm 1mm rgba(5,150,105,0.07)
      `,
    }}>

      {/* Soft glow — top right */}
      <div style={{
        position: 'absolute', top: '-8mm', right: '-6mm', width: '24mm', height: '24mm',
        background: `radial-gradient(circle, ${C.t300}30 0%, transparent 70%)`,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Soft glow — bottom left */}
      <div style={{
        position: 'absolute', bottom: '8mm', left: '-4mm', width: '16mm', height: '16mm',
        background: `radial-gradient(circle, ${C.a200}44 0%, transparent 70%)`,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Top rainbow band ── */}
      <div style={{ width: '100%', height: '1.1mm', display: 'flex', flexShrink: 0, zIndex: 3 }}>
        {[C.g500, C.t600, C.i600, C.a500, C.r400].map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
      </div>

      {/* ── Title strip ── */}
      <div style={{
        background: `linear-gradient(100deg, ${C.g700} 0%, ${C.t600} 100%)`,
        padding: '0.9mm 4mm', zIndex: 2, flexShrink: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        boxShadow: '0 1mm 3mm rgba(6,79,67,0.3)',
      }}>
        <span style={{ fontSize: '4.5pt', fontWeight: 900, letterSpacing: '0.55mm', textTransform: 'uppercase', color: C.g200 }}>
          ◈  Student Identity Card  ◈
        </span>
      </div>

      {/* ── School Header ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '1mm 2mm 0.8mm', background: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottom: `0.3mm solid ${C.g100}`,
        boxShadow: '0 1mm 3mm rgba(5,150,105,0.07)',
      }}>
        <h2 style={{
          fontSize: '9.5pt', color: C.g800, margin: '0 0 0.5mm 0',
          fontWeight: 900, textTransform: 'uppercase', textAlign: 'center',
          lineHeight: 1,
        }}>{schoolinfo.name}</h2>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1, height: '0.25mm', background: `linear-gradient(to left, ${C.a500}, transparent)` }} />
          <span style={{
            fontSize: '3.5pt', color: 'white',
            background: `linear-gradient(90deg, ${C.a500}, ${C.a200}cc)`,
            padding: '0.4mm 2mm', borderRadius: '30px', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.2mm',
            boxShadow: '0 0.5mm 1.5mm rgba(245,158,11,0.35)',
          }}>{schoolinfo.branch} Branch</span>
          <div style={{ flex: 1, height: '0.25mm', background: `linear-gradient(to right, ${C.a500}, transparent)` }} />
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: '0.6mm', marginTop: '0.7mm' }}>
          {[
            { label: `RUN BY: ${schoolinfo.runBy}`, bg: '#f0fdfa', color: C.t600, border: C.t300 },
            { label: `ESTD: ${schoolinfo.estd}`, bg: '#fffbeb', color: '#92400e', border: C.a200 },
            { label: `REG: ${schoolinfo.regNumber}`, bg: C.i100, color: C.i600, border: C.i300 },
          ].map((chip, i) => (
            <div key={i} style={{
              background: chip.bg, color: chip.color,
              border: `0.2mm solid ${chip.border}`,
              padding: '0.4mm 1.2mm', borderRadius: '30px',
              fontSize: '3.2pt', fontWeight: 800, whiteSpace: 'nowrap',
              boxShadow: 'inset 0 0.3mm 0.5mm rgba(255,255,255,0.8)',
            }}>{chip.label}</div>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.8mm', marginTop: '0.7mm',
          background: `linear-gradient(90deg, ${C.g50}, #f0fdfa)`,
          border: `0.2mm solid ${C.g200}`,
          borderRadius: '20px', padding: '0.4mm 2mm',
          boxShadow: 'inset 0 0.2mm 0.5mm rgba(5,150,105,0.07)',
        }}>
          <FaMapMarkerAlt style={{ fontSize: '3.5pt', color: C.t600, flexShrink: 0 }} />
          <span style={{ fontSize: '3.2pt', color: '#374151', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
            {schoolinfo.address}
          </span>
        </div>
      </div>

      {/* ── Photo + Identity ── */}
      <div style={{
        display: 'flex', padding: '1.3mm 3mm 0.8mm', gap: '2.5mm',
        zIndex: 2, position: 'relative', alignItems: 'flex-start', flexShrink: 0,
      }}>
        {/* Photo */}
        <div style={{
          width: '16mm', height: '20mm', flexShrink: 0, padding: '0.5mm',
          background: `linear-gradient(135deg, ${C.g500}, ${C.t600})`,
          borderRadius: '6px',
          boxShadow: `0 1mm 4mm rgba(5,150,105,0.3), inset 0 0.3mm 0.5mm rgba(255,255,255,0.4)`,
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '4.5px', overflow: 'hidden',
            background: C.g100,
            boxShadow: 'inset 0 0.5mm 1mm rgba(0,0,0,0.12)',
          }}>
            {student.photoUrl
              ? <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g500 }}>
                  <FaUser size={22} />
                </div>
            }
          </div>
        </div>

        {/* Name & badges */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.7mm', paddingTop: '0.3mm' }}>
          <div style={{ fontSize: '3.3pt', color: C.g600, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12mm' }}>Student Name</div>
          <h3 style={{
            fontSize: '9pt', fontWeight: 900, color: C.g900,
            textTransform: 'uppercase', lineHeight: 1.1, margin: 0,
          }}>{student.studentName}</h3>

          <div style={{ display: 'flex', gap: '1mm', marginTop: '0.5mm' }}>
            <div style={{
              flex: 1, padding: '0.5mm', textAlign: 'center',
              background: C.g50, border: `0.3mm solid ${C.g200}`,
              borderRadius: '5px', boxShadow: `inset 0 0.3mm 0.8mm rgba(5,150,105,0.1)`,
            }}>
              <div style={{ fontSize: '3pt', color: C.g600, fontWeight: 700, textTransform: 'uppercase' }}>Roll</div>
              <div style={{ fontSize: '7.5pt', color: C.g800, fontWeight: 900 }}>{student.roll}</div>
            </div>
            <div style={{
              flex: 1, padding: '0.5mm', textAlign: 'center',
              background: `linear-gradient(135deg, ${C.g600}, ${C.t600})`,
              borderRadius: '5px',
              boxShadow: `0 0.5mm 2mm rgba(5,150,105,0.35), inset 0 0.3mm 0.5mm rgba(255,255,255,0.15)`,
            }}>
              <div style={{ fontSize: '3pt', color: C.g200, fontWeight: 700, textTransform: 'uppercase' }}>Class</div>
              <div style={{ fontSize: '7.5pt', color: 'white', fontWeight: 900 }}>{student.class}</div>
            </div>
          </div>

          <div style={{
            background: `linear-gradient(90deg, ${C.i100}, #f0fdfa)`,
            border: `0.2mm solid ${C.i300}66`,
            padding: '0.4mm 1mm', borderRadius: '5px',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1mm',
            boxShadow: 'inset 0 0.3mm 0.5mm rgba(255,255,255,0.8)',
          }}>
            <span style={{ fontSize: '3.2pt', color: C.i600, fontWeight: 800, textTransform: 'uppercase' }}>Academic Year</span>
            <span style={{ fontSize: '5.8pt', color: C.i600, fontWeight: 900 }}>2026</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        margin: '0 3mm', height: '0.3mm', zIndex: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${C.g400}88, ${C.t300}66, transparent)`,
      }} />

      {/* ── Details ── */}
      <div style={{ padding: '0.8mm 3mm 0.5mm', flex: 1, zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.7mm' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '1mm 3mm', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2mm' }}>
            <DetailRow icon={<FaUserFriends />} label="Father's Name" value={student.fatherName} iconColor={C.t600} />
            <DetailRow icon={<FaFemale />} label="Mother's Name" value={student.motherName} iconColor={C.g600} />
            <DetailRow icon={<FaMapMarkerAlt />} label="Address" value={student.address} multiLine iconColor={C.i600} valueFontSize="4.8pt" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2mm' }}>
            <DetailRow icon={<FaVenusMars />} label="Gender" value={student.gender} iconColor={C.t600} />
            <DetailRow icon={<FaCalendarAlt />} label="DOB" value={fmt(student.dob)} iconColor={C.a500} />
            <DetailRow icon={<FaTint />} label="Blood" value={student.bloodGroup} iconColor='#e11d48' />
          </div>
        </div>

        {/* Mobile */}
        <div style={{
          background: `linear-gradient(100deg, ${C.g100} 0%, #f0fdfa 100%)`,
          border: `0.3mm solid ${C.g300 || C.g400}`,
          borderRadius: '6px', padding: '0.7mm 2.5mm',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto',
          boxShadow: `inset 0 0.4mm 1mm rgba(5,150,105,0.08), 0 0.5mm 1.5mm rgba(5,150,105,0.1)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <FaPhone size={5} color={C.g600} />
            <span style={{ fontSize: '3.8pt', color: C.g700, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1mm' }}>Mobile No.</span>
          </div>
          <span style={{ fontSize: '8pt', color: C.g900, fontWeight: 900 }}>{student.mobileNumber || '—'}</span>
        </div>
      </div>

      {/* ── QR + Signature ── */}
      <div style={{
        padding: '0.8mm 3mm',
        background: 'rgba(236,253,245,0.8)',
        borderTop: `0.3mm solid ${C.g100}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        zIndex: 2, boxShadow: `inset 0 0.5mm 1mm rgba(5,150,105,0.05)`,
      }}>
        <div ref={qrRef} style={{
          width: '8mm', height: '8mm',
          background: 'white',
          border: `0.3mm solid ${C.g400}`,
          borderRadius: '3px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '0.2mm',
          flexShrink: 0,
          boxShadow: `0 0.5mm 1.5mm rgba(5,150,105,0.15), inset 0 0.2mm 0.5mm rgba(0,0,0,0.05)`,
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5mm' }}>
          <div style={{ width: '22mm', height: '0.35mm', background: `linear-gradient(90deg, ${C.g500}, ${C.t600})` }} />
          <p style={{ fontSize: '4pt', fontWeight: 900, color: C.g700, textTransform: 'uppercase', margin: 0, letterSpacing: '0.15mm' }}>
            Authorized Signatory
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        width: '100%', flexShrink: 0,
        background: `linear-gradient(100deg, ${C.g800} 0%, ${C.g700} 50%, ${C.t600} 100%)`,
        padding: '0.9mm 0',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: '2mm', zIndex: 3,
        boxShadow: 'inset 0 0.5mm 1mm rgba(0,0,0,0.2)',
      }}>
        <FaPhone size={5} color={C.g200} />
        <span style={{ fontSize: '5.5pt', color: '#f0fdf4', fontWeight: 900, letterSpacing: '0.2mm' }}>{schoolinfo.contact.phone}</span>
        <span style={{ fontSize: '4pt', color: C.g400, opacity: 0.7 }}>•</span>
        <span style={{ fontSize: '4.5pt', color: C.g200, fontWeight: 800 }}>{schoolinfo.contact.website.replace('https://', '')}</span>
      </div>

      {/* ── Bottom rainbow ── */}
      <div style={{ width: '100%', height: '1mm', display: 'flex', flexShrink: 0, zIndex: 3 }}>
        {[C.r400, C.a500, C.t600, C.g500, C.i600].map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
      </div>
    </div>
  );
};

// ─── Main Modal ────────────────────────────────────────────────────────────
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
  for (let i = 0; i < students.length; i += 10) pages.push(students.slice(i, i + 10));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-[95vw] h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="px-10 py-5 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Print ID Cards</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">{selectedClass}</span>
              <span className="text-xs font-semibold text-gray-400">{students.length} Students</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handlePrint()} className="flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-all">
              <FaPrint size={14} /> PRINT
            </button>
            <button onClick={onClose} className="p-4 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-2xl transition-colors">
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-10 bg-slate-100 dark:bg-slate-900">
          <div ref={componentRef} className="mx-auto print-area" style={{ width: 'fit-content' }}>
            {pages.map((pageStudents, pageIdx) => (
              <div key={pageIdx} className="page-break" style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 54mm)',
                gridTemplateRows: 'repeat(2, 86mm)', gap: '5mm',
                width: 'fit-content', padding: '10mm 0 0 0',
                boxSizing: 'border-box', pageBreakAfter: 'always', marginBottom: '50px',
              }}>
                {pageStudents.map((stu, idx) => <IDCard key={idx} student={stu} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
