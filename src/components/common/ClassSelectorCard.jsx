import React, { useState, useEffect } from 'react';
import { classesInTheSchool } from '../../shared/schoolInformation';

export default function ClassSelectorCard({ 
  onSelect, 
  selectedClass: propSelectedClass = '',
  title = 'Class Selection'
}) {
  const [selectedClass, setSelectedClass] = useState(propSelectedClass);
  
  // Update internal state when props change
  useEffect(() => {
    setSelectedClass(propSelectedClass);
  }, [propSelectedClass]);

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{title}:</h2>
              {selectedClass && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full font-medium sm:hidden">
                  {selectedClass}
                </span>
              )}
            </div>
            <div className="w-full pb-2">
              <div className="flex flex-wrap items-center justify-start gap-2">
                {[...classesInTheSchool].sort((a, b) => {
                  // Handle LKG and UKG first
                  if (a === 'LKG' && b === 'UKG') return -1;
                  if (a === 'UKG' && b === 'LKG') return 1;
                  if (a === 'LKG') return -1;
                  if (b === 'LKG') return 1;
                  if (a === 'UKG') return -1;
                  if (b === 'UKG') return 1;
                  // Then sort other classes numerically
                  return a.localeCompare(b, undefined, {numeric: true});
                }).map((cls) => (
                  <button
                    key={cls}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-150 font-medium whitespace-nowrap flex-shrink-0 ${
                      cls === selectedClass
                        ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => cls !== selectedClass && onSelect?.(cls)}
                    aria-pressed={cls === selectedClass}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {selectedClass && (
            <span className="hidden sm:inline-flex items-center text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 px-3 py-1.5 rounded-lg font-medium">
              Selected: <span className="font-semibold ml-1">{selectedClass}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}