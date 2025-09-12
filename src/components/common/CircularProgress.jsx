import React from 'react';

const CircularProgress = ({ 
  value, 
  size = 80, 
  strokeWidth = 6,
  showPercentage = true,
  showText = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (val) => {
    if (val >= 85) return 'text-green-500';
    if (val >= 70) return 'text-blue-500';
    if (val >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getText = (val) => {
    if (val >= 90) return 'Excellent';
    if (val >= 75) return 'Very Good';
    if (val >= 60) return 'Good';
    if (val >= 40) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={`${getColor(value)} transition-all duration-500 ease-in-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-2xl font-bold">{Math.round(value)}%</span>
        )}
        {showText && (
          <span className="text-xs opacity-80 mt-1">{getText(value)}</span>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
