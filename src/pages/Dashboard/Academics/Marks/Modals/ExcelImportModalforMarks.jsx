import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { FiUpload, FiFileText, FiCheck, FiAlertCircle, FiX, FiDownload, FiType } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { getExamConfig } from "@/services/examConfig";

const ExcelImportModal = ({
  isOpen,
  onClose,
  selectedExam,
  selectedColumns,
  onImport,
  selectedClass,
  title,
  classConfig,
  evaluationTypes,
  examConfig,
}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [file, setFile] = useState(null);
  
  // Initialize selectedEvaluationType with the first evaluation type from props
  const [selectedEvaluationType, setSelectedEvaluationType] = useState(
    evaluationTypes?.[0] || 'Written'
  );
  
  // State for subjects
  const [subjects, setSubjects] = useState([]);
  const [localExamConfig, setLocalExamConfig] = useState(null);

  

  console.log(examConfig, "in modal");
  
  // Process exam configuration when props change
  useEffect(() => {
    const processExamConfig = () => {
      if (!selectedClass || !selectedExam) {
        console.warn('Missing required props:', { selectedClass, selectedExam });
        setSelectedEvaluationType(evaluationTypes?.[0] || 'Written');
        setSubjects([]);
        return;
      }

      try {
        console.log('Processing exam config for:', { 
          class: selectedClass, 
          exam: selectedExam,
          hasClassConfig: !!classConfig,
          hasExamConfig: !!examConfig
        });
        
        // Get the exam configuration from classConfig
        const config = classConfig?.examConfig?.[selectedExam];
        
        if (!config) {
          console.warn('No exam configuration found for exam:', selectedExam);
          console.log('Available exams in classConfig:', classConfig?.examConfig ? Object.keys(classConfig.examConfig) : 'No exam config');
          setSelectedEvaluationType(evaluationTypes?.[0] || 'Written');
          setSubjects([]);
          return;
        }
        
        setLocalExamConfig(config);
        
        // Set the selected evaluation type from props if available
        if (evaluationTypes && evaluationTypes.length > 0) {
          setSelectedEvaluationType(evaluationTypes[0]);
        }
        
        // Extract subjects from config
        let extractedSubjects = [];
        if (config.subjects && Array.isArray(config.subjects)) {
          // New format with explicit subjects array
          extractedSubjects = [...config.subjects];
        } else if (config.fullMarks) {
          // Extract subjects from fullMarks object if available
          extractedSubjects = Object.keys(config.fullMarks).filter(
            key => !['examDate', 'startTime', 'endTime', 'evaluationTypes', 'schedule'].includes(key)
          );
        } else {
          // Legacy format - extract subject keys from config
          extractedSubjects = Object.keys(config).filter(
            key => 
              !['examTotal', 'examDate', 'startTime', 'endTime', 'fullMarks', 'evaluationTypes', 'schedule'].includes(key) &&
              typeof config[key] === 'object'
          );
        }
        
        console.log('Extracted subjects:', extractedSubjects);
        setSubjects(extractedSubjects);
        
        // If we have evaluationTypes from props, use them
        if (evaluationTypes && evaluationTypes.length > 0) {
          console.log('Using evaluation types from props:', evaluationTypes);
          setSelectedEvaluationType(evaluationTypes[0]);
          return;
        }
        
        // Fallback to default evaluation types
        console.warn('No evaluation types found in config or props, using default');
        setSelectedEvaluationType('Written');
        
      } catch (error) {
        console.error('Error processing exam configuration:', error);
        setSelectedEvaluationType(evaluationTypes?.[0] || 'Written');
        setSubjects([]);
      }
    };

    if (classConfig) {
      processExamConfig();
    }
  }, [selectedClass, selectedExam, classConfig, evaluationTypes]);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const downloadTemplate = () => {
    // Create sample data for the template
    const templateData = [
      {
        'Roll': '1',
        'Student Name': 'John Doe',
        // Add subjects dynamically if available
        ...(selectedColumns?.filter(col => col !== 'Roll' && col !== 'Student Name').reduce((acc, subject) => ({
          ...acc,
          [subject]: ''
        }), {}) || {})
      },
      {
        'Roll': '2',
        'Student Name': 'Jane Smith',
        ...(selectedColumns?.reduce((acc, subject) => ({
          ...acc,
          [subject]: ''
        }), {}) || {})
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
    
    // Generate file and trigger download
    XLSX.writeFile(wb, `${selectedClass}_${selectedExam || 'Marks'}_Template.xlsx`);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Clear previous data and error
    setError("");
    setPreviewData(null);
    setFile(uploadedFile);

    // Process the file
    processFile(uploadedFile);
  };

  // Function to transform subject values into { [evaluationType]: value } format
  const transformSubjectValues = (data) => {
    if (!Array.isArray(data)) return [];
    
    // Get the current evaluation type, default to 'written' if not set
    const evalType = selectedEvaluationType?.toLowerCase() || 'written';
    
    return data.map(student => {
      const transformed = { ...student };
      
      // List of subject fields that should be transformed
      const subjectFields = Object.keys(transformed).filter(key => 
        !['roll', 'studentName', 'id'].includes(key.toLowerCase())
      );
      
      subjectFields.forEach(field => {
        const value = transformed[field];
        
        // If the value is a string and not a number, or if it's 'AB' (case insensitive)
        if (typeof value === 'string' && (value.toUpperCase() === 'AB' || !value.match(/^\d+(\.\d+)?$/))) {
          transformed[field] = { [evalType]: value };
        } 
        // If it's already an object but not in the right format
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // If it already has the current evaluation type property, keep it as is
          if (evalType in value) {
            transformed[field] = value;
          }
          // If it has a 'written' property but not the current evalType, rename it
          else if ('written' in value) {
            transformed[field] = { [evalType]: value.written };
          }
          // Otherwise, wrap the whole object in the current evaluation type
          else {
            transformed[field] = { [evalType]: value };
          }
        }
        // For numbers or any other case, wrap in the current evaluation type
        else {
          transformed[field] = { [evalType]: value };
        }
      });
      
      return transformed;
    });
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          raw: false,
        });
        
        if (jsonData.length < 2) {
          setError("The file is empty or has no data");
          return;
        }

        // Get exam configuration
        const examConfig = classConfig?.examConfig?.[selectedExam];
        if (!examConfig) {
          setError("Exam configuration not found. Please configure the exam first.");
          return;
        }

        // Get subjects from config
        let subjects = [];
        if (examConfig.subjects && Array.isArray(examConfig.subjects)) {
          subjects = examConfig.subjects;
        } else {
          // Fallback to legacy format - extract subjects from fullMarks or other properties
          subjects = Object.keys(examConfig).filter(key => 
            key !== 'examTotal' && 
            key !== 'examDate' && 
            key !== 'startTime' && 
            key !== 'endTime' &&
            key !== 'fullMarks' &&
            key !== 'subjects' &&
            key !== 'evaluationTypes' &&
            key !== 'schedule' &&
            typeof examConfig[key] === 'object'
          );
        }

        const headers = jsonData[0].map(h => h ? h.toString().trim() : '');
        
        // Normalize headers to lowercase for case-insensitive comparison
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        
        // Use selectedColumns prop if available, otherwise default to required columns
        const requiredColumns = selectedColumns && selectedColumns.length > 0 
          ? selectedColumns 
          : ['Roll', 'Name'];
        
        // Check for required columns (case-insensitive)
        const missingHeaders = requiredColumns.filter(required => {
          const requiredLower = required.toLowerCase();
          return !normalizedHeaders.includes(requiredLower);
        });
        
        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(', ')}. Please make sure your Excel file includes these columns.`);
          return;
        }

        // Create a map of header names (lowercase) to their index for faster lookup
        const headerMap = {};
        headers.forEach((header, index) => {
          if (header) {  // Only add non-empty headers
            headerMap[header.toLowerCase()] = index;
          }
        });
        
        // Log for debugging
        console.log('Headers found in file:', headers);
        console.log('Required columns:', requiredColumns);
        console.log('Header map:', headerMap);
        
        // Process rows
        const processedData = [];
        
        // Get all subject headers that exist in the Excel file
        const subjectHeaders = headers.filter(header => 
          header && !['roll', 'name', 'student name'].includes(header.toLowerCase())
        );
        
        // Update subjects array with actual headers from the file
        const updatedSubjects = [...new Set([...subjects, ...subjectHeaders])];
        
        jsonData.slice(1).forEach((row) => {
          // Skip empty rows
          if (row.every(cell => cell === undefined || cell === null || cell === '')) {
            return;
          }
          
          const rowData = {
            Roll: '',
            Name: '',
            class: selectedClass,
            marks: {}
          };
          
          // First, process all columns to collect data
          const rowValues = {};
          headers.forEach((header, index) => {
            if (header) {
              const value = row[index];
              rowValues[header.toLowerCase()] = value !== undefined && value !== null ? String(value).trim() : '';
            }
          });
          
          // Set Roll and Name
          rowData.Roll = rowValues.roll || '';
          rowData.Name = rowValues.name || rowValues['student name'] || '';
          
          // Process subject marks
          updatedSubjects.forEach(subject => {
            const subjectLower = subject.toLowerCase();
            const cellValue = rowValues[subjectLower] || '';
            
            if (cellValue.toUpperCase() === 'AB') {
              rowData.marks[subject] = 'AB';
            } else if (cellValue === '') {
              rowData.marks[subject] = '';
            } else {
              const mark = parseFloat(cellValue);
              rowData.marks[subject] = isNaN(mark) ? '' : mark;
            }
          });
          
          // Only add if we have valid roll and name
          if (rowData.Roll && rowData.Name) {
            processedData.push(rowData);
          }
        });
        
        if (processedData.length === 0) {
          setError("No valid data found in the Excel file.");
          return;
        }
        
        setData(processedData);
        
        // Prepare preview data with all subjects
        const previewHeaders = ['Roll', 'Name', ...updatedSubjects];
        
        // Create a preview of all rows
        const previewRows = processedData.map(row => {
          // Create a new row object with all required fields
          const previewRow = {};
          
          // Handle Roll and Name (case insensitive)
          previewRow.Roll = row.Roll || row.roll || '';
          previewRow.Name = row.Name || row.name || row['student name'] || '';
          
          // Add all subjects with proper fallbacks
          subjects.forEach(subject => {
            // Check both the direct subject key and the marks object
            const markValue = row[subject] !== undefined ? 
              row[subject] : 
              (row.marks && row.marks[subject] !== undefined ? row.marks[subject] : '');
              
            // Format the display value
            if (markValue === 'AB' || markValue === 'ab') {
              previewRow[subject] = 'AB';
            } else if (markValue === '' || markValue === null || markValue === undefined) {
              previewRow[subject] = '-';
            } else {
              // Try to parse as number, but keep as string if not a valid number
              const numValue = parseFloat(markValue);
              previewRow[subject] = isNaN(numValue) ? String(markValue) : numValue;
            }
          });
          
          return previewRow;
        });
        
        // Set the preview data
        const previewData = {
          headers: previewHeaders,
          rows: previewRows.map(row => {
            const newRow = {};
            previewHeaders.forEach(header => {
              newRow[header] = row[header] || '';
            });
            return newRow;
          })
        };
        setPreviewData(previewData);
      } catch (error) {
        console.error("Error processing file:", error);
        setError(`Error processing file: ${error.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };


  const handleImport = async () => {
    console.log('Selected Evaluation Type:', selectedEvaluationType);
    if (!data || data.length === 0) {
      setError("No data to import");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      // Get the current evaluation type, default to 'written' if not set
      const evalType = selectedEvaluationType?.toLowerCase() || 'written';
      
      // Process the data for import
      const importData = data.map(row => {
        // Create a clean marks object, skipping empty values
        const cleanMarks = {};
        
        // Process each mark
        Object.entries(row.marks || {}).forEach(([subject, mark]) => {
          // Skip empty strings, null, or undefined marks
          if (mark === '' || mark === null || mark === undefined) return;
          
          // For AB (Absent) values, convert to { [evalType]: 'AB' }
          if (mark === 'AB' || mark === 'ab') {
            cleanMarks[subject] = { [evalType]: 'AB' };
          } 
          // For numeric values, create { [evalType]: value } object
          else if (!isNaN(mark)) {
            cleanMarks[subject] = { [evalType]: String(mark) };
          }
          // If it's already an object
          else if (typeof mark === 'object' && mark !== null) {
            // If it already has the current evaluation type property, keep it as is
            if (evalType in mark) {
              cleanMarks[subject] = mark;
            }
            // If it has a 'written' property but not the current evalType, rename it
            else if ('written' in mark) {
              cleanMarks[subject] = { [evalType]: mark.written };
            }
            // Otherwise, wrap the whole object in the current evaluation type
            else {
              cleanMarks[subject] = { [evalType]: mark };
            }
          }
          // For any other case, wrap in the current evaluation type
          else {
            cleanMarks[subject] = { [evalType]: String(mark) };
          }
        });
        
        // Return the student data with roll and name at root level
        return {
          roll: String(row.Roll || '').trim(),
          studentName: String(row.Name || '').trim(),
          ...cleanMarks
        };
      }).filter(item => item.roll && item.studentName); // Filter out any invalid entries

      console.log('Processed data for import:', importData);
      
      if (importData.length === 0) {
        throw new Error("No valid student records to import");
      }
      
      // Call the onImport callback with the processed data and the selected evaluation type
      await onImport(importData, selectedEvaluationType);
      
      // Close the modal on success
      onClose();
    } catch (error) {
      console.error("Error during import:", error);
      setError(error.message || "An error occurred during import");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData(null);
    setError("");
  };

  if (!isMounted) return null;

  // Animation variants for modal
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    }
  };

  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  if (!isMounted) return null;

  if (isOpen) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            variants={backdropVariants}
          />
          <motion.div
            className="relative z-10 w-full max-w-5xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <motion.div className="flex items-center space-x-3">
                    <h3
                      className="text-xl font-semibold text-gray-900 dark:text-white"
                      variants={itemVariants}
                      custom={0}
                    >
                      Import {title} from Excel
                    </h3>
                    {selectedEvaluationType && (
                      <motion.span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                        variants={itemVariants}
                        custom={0.1}
                      >
                        {selectedEvaluationType}
                      </motion.span>
                    )}
                  </motion.div>
                  <motion.p
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    variants={itemVariants}
                    custom={0.1}
                  >
                    Upload an Excel file with {selectedEvaluationType?.toLowerCase() || 'evaluation'} marks
                  </motion.p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  variants={itemVariants}
                  custom={0.1}
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </motion.button>
              </div>
              <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-1">
                Upload an Excel file with {title.toLowerCase()} data.
                Supported formats: .xlsx, .xls, .csv
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-1 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Required Columns:
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedColumns.map((col, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Class and Exam Info */}
              <div className=" bg-gray-50 gap-8 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-around align-center border-2 text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Class</h3>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {selectedClass || 'Not selected'}
                    </p>
                  </div>
                  <div className="flex justify-around align-center border-2 text-center ">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Exam</h3>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {selectedExam || 'Not selected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evaluation Type Selection */}
              {evaluationTypes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evaluation Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {evaluationTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                          selectedEvaluationType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedEvaluationType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the type of marks you're importing
                  </p>
                </div>
              )}

              <div className="w-full">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Upload Button */}
                  <div className="flex-1">
                    <div 
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer transition-colors p-6 text-center"
                    >
                      <FiUpload className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">
                        {file ? 'Change File' : 'Upload Excel File'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drag & drop or click to browse
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        XLSX, XLS, or CSV (MAX. 10MB)
                      </p>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="flex items-center justify-center">
                    <div className="h-20 w-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  
                  {/* Download Template Button */}
                  <div className="flex-1">
                    <div 
                      onClick={downloadTemplate}
                      className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors p-6 text-center"
                    >
                      <FiDownload className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-3" />
                      <p className="font-medium text-indigo-700 dark:text-indigo-200 mb-1">
                        Download Template
                      </p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        Get the Excel template
                      </p>
                      <p className="text-xs text-indigo-500/80 dark:text-indigo-500 mt-1">
                        Pre-formatted with required columns
                      </p>
                    </div>
                  </div>
                </div>
                {file && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <FiX className="mr-1.5 h-4 w-4" />
                      Remove File
                    </button>
                  </div>
                )}
                {file && (
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs mx-auto">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {previewData?.rows?.length || 0} records found
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-2 p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 flex items-start space-x-2">
                  <FiAlertCircle className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {previewData && (
                <div className="mt-4 overflow-hidden border rounded-lg shadow-sm dark:border-gray-700 transition-all duration-300 hover:shadow-md flex flex-col">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Preview ({previewData.rows.length} rows)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Showing all {previewData.rows.length} rows
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <FiCheck className="mr-1 h-3 w-3" />
                        {previewData.rows.length} rows ready
                      </span>
                    </div>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {previewData.rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            {previewData.headers.map((header, cellIndex) => {
                              // Get the value, handling different possible header formats
                              const headerLower = header.toLowerCase();
                              let value = '';
                              
                              if (headerLower === 'roll') {
                                value = row.Roll || row.roll || '-';
                              } else if (headerLower === 'name') {
                                value = row.Name || row.name || row['student name'] || '-';
                              } else {
                                // For subject columns
                                value = row[header] !== undefined ? 
                                  (row[header] === '' ? '-' : row[header]) : 
                                  '-';
                              }
                              
                              return (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                >
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end">
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={!previewData || isLoading}
                      className={`relative px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ${
                        !previewData || isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md transform hover:-translate-y-0.5'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Importing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <FiUpload className="w-4 h-4" />
                          Import Data
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
  return null;
};

export default ExcelImportModal;