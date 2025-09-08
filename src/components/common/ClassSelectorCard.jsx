import React, { useEffect, useState } from 'react';
import { classesIntheSchhol } from '../../shared/schoolInformation';
import { getClassConfig } from '../../services/classConfig';

export default function ClassSelectorCard({ onSelect, selected, key }) {
  // Ensure we have a stable reference to the selected class
  const selectedClass = selected || '';
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Get config for each class and create a status map
        const configPromises = classesIntheSchhol.map(className => 
          getClassConfig(className).catch(() => null)
        );
        const configs = await Promise.all(configPromises);
        const map = {};
        configs.forEach((config, index) => {
          if (config) {
            map[classesIntheSchhol[index]] = {
              isConfigured: true,
              subjectCount: config.subjects?.length || 0,
              termCount: config.terms?.length || 0
            };
          } else {
            map[classesIntheSchhol[index]] = {
              isConfigured: false,
              subjectCount: 0,
              termCount: 0
            };
          }
        });
        if (mounted) setStatusMap(map || {});
      } catch (_) {
        if (mounted) setStatusMap({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
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
              onClick={() => {
                // Only trigger onSelect if the class is different
                if (cls !== selectedClass) {
                  onSelect && onSelect(cls);
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                selectedClass === cls
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                  : statusMap?.[cls]?.configured === false
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/50'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
              }`}
              aria-pressed={selected === cls}
            >
              {cls}
              {!loading && statusMap?.[cls]?.configured === false && (
                <span 
                  className="ml-2 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
                  title="Configuration required"
                />
              )}
            </button>
          ))}
        </div>
      </div>
     
    </div>
  );
}