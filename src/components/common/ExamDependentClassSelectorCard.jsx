import React, { useEffect, useState } from 'react';
import { classesInTheSchool } from '../../shared/schoolInformation';
import { useExamConfigStatus } from '../../services/examConfig';
import { FaBookOpen } from 'react-icons/fa';

export default function ExamDependentClassSelectorCard({ 
  onSelect, 
  selectedClass: propSelectedClass = '',
  title = 'Class Selection',
  showConfigMessage = false,
  color = 'indigo' // Default color if not specified
}) {
  const [selectedClass, setSelectedClass] = useState(propSelectedClass);
  const [statusMap, setStatusMap] = useState({});
  
  // Update internal state when props change
  useEffect(() => {
    setSelectedClass(propSelectedClass);
  }, [propSelectedClass]);
  
  // Use the React Query hook to fetch exam config status
  const { data: statusData, isLoading, error } = useExamConfigStatus(
    classesInTheSchool,
    { 
      enabled: classesInTheSchool && classesInTheSchool.length > 0,
      onError: (err) => {
        console.error('Error fetching exam config status:', err);
      }
    }
  );

  // Process the status data when it changes
  useEffect(() => {
    const defaultStatus = {};
    
    // Initialize default status for all classes
    classesInTheSchool.forEach(className => {
      defaultStatus[className] = {
        isConfigured: false,
        hasExams: false,
        examCount: 0,
        className,
        hasError: false
      };
    });

    // If we have valid status data, update the status map
    if (statusData && Array.isArray(statusData)) {
      statusData.forEach(item => {
        if (!item) return;
        
        // Handle different possible response formats
        const className = item.className || item.class;
        if (!className) return;
        
        // Map the backend response to the expected format
        const isConfigured = item.configured || item.isConfigured || false;
        const hasExams = item.hasExams || (item.examCount > 0) || false;
        const examCount = item.examCount || (hasExams ? 1 : 0);
        
        // Update the status for this class
        defaultStatus[className] = {
          isConfigured,
          hasExams,
          examCount,
          ...item,
          className // Ensure className is set correctly
        };
      });
    }
    
    // If there was an error, mark all classes with error
    if (error) {
      Object.keys(defaultStatus).forEach(className => {
        defaultStatus[className].hasError = true;
      });
    }
    
    console.log('Formatted status map:', defaultStatus);
    setStatusMap(defaultStatus);
  }, [statusData, error]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 w-full">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{title}:</span>
            {selectedClass && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full font-medium hidden md:block">
                {statusMap[selectedClass]?.isConfigured ? 'Configured' : 'Not Configured'}
              </span>
            )}
          </div>
          <div className="w-full pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
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
              }).map((cls) => {
                const isSelected = selectedClass === cls;
                const isDisabled = statusMap[cls]?.hasError || false;
                
                return (
                  <button
                    key={cls}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex items-center justify-center gap-1.5 flex-shrink-0 ${
                      isSelected
                        ? `bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-md`
                        : isDisabled
                        ? `bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 cursor-not-allowed`
                        : statusMap[cls]?.isConfigured
                        ? 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                    }`}
                    onClick={() => onSelect?.(cls)}
                    aria-pressed={isSelected}
                    aria-disabled={isDisabled}
                  >
                    {cls}
                  </button>
                );
              })}
              
            </div>
          </div>
          
          {/* Configuration message - only shown if showConfigMessage is true */}
          {showConfigMessage && selectedClass && statusMap[selectedClass] && (!statusMap[selectedClass].isConfigured || !statusMap[selectedClass].hasExams) && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {!statusMap[selectedClass].isConfigured 
                      ? `Exams not configured for ${selectedClass}`
                      : `No exams available for ${selectedClass}`}
                  </h3>
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    <p>
                      {!statusMap[selectedClass].isConfigured 
                        ? 'Please configure the exam settings before proceeding.'
                        : `This class has been configured but no exams have been added yet.`}
                    </p>
                  </div>
                  <div className="mt-3">
                    <a
                      href="/dashboard/exams"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                      <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configure Exams
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
