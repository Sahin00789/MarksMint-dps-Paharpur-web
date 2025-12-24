
// Helper Components for Progress Bars
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
          stroke="#e2e8f0"
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
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '10px', fontWeight: 'bold', color: '#334155' }}>{Math.round(value)}%</div>
    </div>
  );
};

const LinearProgress = ({ value, color, height = 6 }) => (
  <div style={{ width: '100%', height, backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', backgroundColor: color, borderRadius: '10px' }}></div>
  </div>
);
