import React, { useEffect, useState } from 'react';
import { classesIntheSchhol } from '../../shared/schoolInformation';
import { getClassesConfigStatus } from '../../services/classConfig';

export default function ClassSelectorCard({ onSelect, selected }) {
  // Use the selected prop directly to ensure it stays in sync with parent
  const selectedClass = selected || '';
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchConfigStatus = async () => {
      setLoading(true);
      try {
        // Use the bulk status endpoint to get all configs at once
        const statusMap = await getClassesConfigStatus(classesIntheSchhol);
        
        // Transform the data to match our expected format
        const formattedMap = {};
        classesIntheSchhol.forEach(className => {
          const config = statusMap[className] || {};
          formattedMap[className] = {
            isConfigured: config.configured || false,
            subjectCount: config.subjects?.length || 0,
            termCount: config.terms?.length || 0,
            ...config
          };
        });
        
        if (mounted) setStatusMap(formattedMap);
      } catch (error) {
        console.error('Error fetching class config status:', error);
        if (mounted) setStatusMap({});
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchConfigStatus();
    
    return () => { mounted = false; };
  }, []);

  return (
    <div className="sticky bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className='flex gap-10 items-center'>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Class Selection</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 ">
            {selected ? `Selected: ${selected}` : 'Choose a class to view students'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 gap-y-5">
          {classesIntheSchhol.map((cls, index) => (
            <button
              key={index}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                cls === selectedClass
                  ? 'bg-indigo-600 text-white'
                  : statusMap?.[cls]?.configured === false
                  ? 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => {
                // Only trigger onSelect if the class is different
                if (cls !== selectedClass) {
                  onSelect && onSelect(cls);
                }
              }}
              aria-pressed={selected === cls}
            >
              <span className="flex items-center">
                {cls}
                {!loading && statusMap?.[cls]?.configured === false && (
                  <span 
                    className="ml-1.5 text-xs opacity-80"
                    title="Configuration required - Click to configure this class"
                  >
                    ⚠️
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
     
    </div>
  );
}