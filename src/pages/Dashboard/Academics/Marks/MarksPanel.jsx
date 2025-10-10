import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { FiUpload, FiPrinter, FiLoader } from "react-icons/fi";
import ExamDependentClassSelectorCard from "@/components/common/ExamDependentClassSelectorCard";
import {
  getStudentsByClass,
  updateStudent,
  bulkUpdateMarks,
} from "@/services/students";
import { getExamConfig, listExamConfigs } from "@/services/examConfig";
import ExcelImportModalforMarks from "@/pages/Dashboard/Academics/Marks/Modals/ExcelImportModalforMarks.jsx";
import MarksUpdateModalV2 from "./Modals/MarksUpdateModalV2";
import { Circle } from "lucide-react";

/**
 * Safely extracts a mark value from potentially nested objects or arrays
 * @param {any} mark - The mark value to extract (can be string, number, object, or array)
 * @returns {string|number} - The extracted mark value as a string or number
 */
const extractMarkValue = (mark) => {
  // Common keys that might contain the mark value in an object
  const possibleKeys = ['mark', 'value', 'obtained', 'marks', 'score', 'total'];
  
  // Handle null/undefined
  if (mark == null || mark === '') return '';

  // If it's a string or number, return as is after trimming if string
  if (typeof mark === 'string') {
    const trimmed = mark.trim();
    return trimmed === 'AB' || trimmed === '0' ? 'AB' : trimmed;
  }
  if (typeof mark === 'number') {
    return mark === 0 ? 'AB' : mark;
  }

  // If it's an array, get the first non-null value
  if (Array.isArray(mark)) {
    for (const item of mark) {
      const result = extractMarkValue(item);
      if (result !== '') return result;
    }
    return '';
  }

  // If it's an object, try to extract a value
  if (typeof mark === 'object' && mark !== null) {
    // Handle direct mark value in common keys
    for (const key of possibleKeys) {
      if (mark[key] !== undefined && mark[key] !== null && mark[key] !== '') {
        const result = extractMarkValue(mark[key]);
        if (result !== '') return result;
      }
    }

    // If no specific key found, try to get the first non-null value that looks like a mark
    for (const [key, value] of Object.entries(mark)) {
      // Skip special keys that aren't actual mark values
      if (['_id', '__v', 'createdAt', 'updatedAt', 'subject', 'type'].includes(key)) continue;
      
      const result = extractMarkValue(value);
      if (result !== '') return result;
    }
  }

  // Default fallback
  return '';
};

// Helper function to safely render mark values
const renderMarkValue = (mark) => {
  if (mark === undefined || mark === null) return '0';
  
  // If mark is already a number or a string that can be converted to a number
  if (!isNaN(Number(mark))) {
    const num = Number(mark);
    return num === 0 ? '0' : num.toString();
  }
  
  // If mark is a string
  if (typeof mark === 'string') {
    const trimmed = mark.trim();
    if (trimmed === '' || trimmed.toUpperCase() === 'AB') return 'AB';
    if (!isNaN(Number(trimmed))) return Number(trimmed).toString();
    return trimmed;
  }
  
  // If mark is an object, try to find a value
  if (typeof mark === 'object') {
    // Try common mark value keys
    const possibleKeys = ['mark', 'value', 'obtained', 'marks', 'score', 'total'];
    for (const key of possibleKeys) {
      if (mark[key] !== undefined && mark[key] !== null && mark[key] !== '') {
        return renderMarkValue(mark[key]);
      }
    }
    
    // Try to find any numeric value
    for (const [key, value] of Object.entries(mark)) {
      if (['_id', '__v', 'createdAt', 'updatedAt', 'subject', 'type'].includes(key)) continue;
      const result = renderMarkValue(value);
      if (result !== '0' && result !== 'AB') return result;
    }
  }
  
  return '0';
};

// Calculate ranks for students based on their total marks and roll number
const calculateRanks = (students, examName) => {
  if (!students || !students.length) return [];

  // Calculate total marks for each student and create a new array with the totals
  const studentsWithTotals = students.map((student) => {
    // Debug log for a specific student
    if (student.roll === '22') {
      console.log('Processing student with roll 22:', student);
    }
    let totalMarks = 0;
    let totalPossibleMarks = 0;
    let hasMarks = false;
    let subjectCount = 0;

    if (student.marks && student.marks[examName]) {
      const subjects = student.marks[examName];
      
      // Calculate total marks and possible marks for each subject
      Object.entries(subjects).forEach(([subject, marks]) => {
        // Skip if marks is not an object (legacy format)
        if (typeof marks !== 'object' || marks === null) return;
        
        let subjectTotal = 0;
        let subjectMax = 0;
        let hasSubjectMarks = false;
        
        // For each evaluation type in the subject (e.g., 'written' or 'oral')
        Object.entries(marks).forEach(([type, mark]) => {
          const markValue = extractMarkValue(mark);
          
          // Skip if mark is absent or invalid
          if (markValue === 'AB' || markValue === '' || markValue === null || markValue === undefined) {
            return;
          }
          
          // Convert to number and add to total if valid
          const numericMark = Number(markValue);
          if (!isNaN(numericMark)) {
            // For written and oral, the max marks are 420 each (as per your example)
            const maxForType = type === 'written' || type === 'oral' ? 420 : 100;
            
            subjectTotal += numericMark;
            subjectMax += maxForType;
            hasSubjectMarks = true;
            hasMarks = true;
          }
        });
        
        if (hasSubjectMarks) {
          totalMarks += subjectTotal;
          totalPossibleMarks += subjectMax;
          subjectCount++;
        }
      });
    }

    // Parse roll number to handle both string and number formats
    const rollNumber = parseInt(student.roll || student.rollNumber || "999999", 10) || 999999;
    
    let percentage = 0;
    if (hasMarks && totalPossibleMarks > 0) {
      percentage = Math.min(100, Math.max(0, Math.round((totalMarks / totalPossibleMarks) * 100)));
    }

    // Debug log for roll 22
    if (student.roll === '22') {
      console.log(`Student 22 - Marks: ${totalMarks}/${totalPossibleMarks}, Percentage: ${percentage}%`);
      console.log('Student marks:', student.marks);
    }

    // Parse roll number to handle both string and number formats
    return {
      ...student,
      totalMarks: Math.round(totalMarks),
      totalPossibleMarks,
      percentage,
      subjectCount,
      parsedRollNumber: rollNumber,
    };
  });

  // Sort students by total marks (descending) and then by roll number (ascending)
  const sortedStudents = [...studentsWithTotals].sort((a, b) => {
    // First sort by total marks (descending)
    const aMarks = a.totalMarks || 0;
    const bMarks = b.totalMarks || 0;

    if (aMarks !== bMarks) {
      return bMarks - aMarks;
    }

    // If marks are equal, sort by roll number (ascending)
    return a.parsedRollNumber - b.parsedRollNumber;
  });

  // Assign unique ranks (no ties)
  const rankedStudents = [];

  sortedStudents.forEach((student, index) => {
    // Rank is position in the sorted array + 1 (since array is 0-based)
    const rank = index + 1;

    // Add the student with their rank
    rankedStudents.push({
      ...student,
      rank: rank,
      totalStudents: sortedStudents.length,
    });
  }); // Close the forEach loop

  return rankedStudents;
};

export default function MarksPanel() {
  // Load saved selections from localStorage or use defaults
  const [selectedClass, setSelectedClass] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ui.selectedClass") || "";
    }
    return "";
  });
  const [selectedExam, setSelectedExam] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ui.selectedExam") || "";
    }
    return "";
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exams, setExams] = useState([]);
  const [examConfigs, setExamConfigs] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingMarks, setEditingMarks] = useState({});
  const [editingExamConfig, setEditingExamConfig] = useState(null);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printPreviewRef = useRef(null);

  // State to store full marks for each exam
  const [fullMarks, setFullMarks] = useState({});
  const [methodMarks, setMethodMarks] = useState({});
  const [processedStudents, setProcessedStudents] = useState([]);
  
  // Create a ref to store method marks during render
  const methodMarksRef = useRef({});

  // Academic year - hardcoded to match your data
  const academicYear = "2024-2025";

  // Local state for class config
  const [classConfig, setClassConfig] = useState(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [showExamConfig, setShowExamConfig] = useState(false);

  // Process students with exam config and calculate method marks
  useEffect(() => {
    if (students.length > 0 && selectedExam && classConfig) {
      // Process students, filter subjects based on religion, and attach exam config
      const processed = students.map(student => {
        // Get the exam config for the selected exam
        const examConfig = { 
          ...(classConfig.examConfig?.[selectedExam] || {}),
          examName: selectedExam 
        };
        
        // Filter subjects based on religion if needed
        if (examConfig.fullMarks) {
          const isMuslim = student.religion?.toLowerCase() === 'islam';
          
          // Create a new filtered fullMarks object
          const filteredFullMarks = {};
          
          // First filter the subjects array
          if (examConfig.subjects) {
            examConfig.subjects = examConfig.subjects.filter(subject => {
              const subjectLower = subject.toLowerCase();
              // If religion is not specified, exclude Arabic-Hindi
              if (!student.religion) {
                return !subjectLower.includes('arabic-hindi');
              }
              
              // For Muslim students, exclude Hindi but include Arabic-Hindi
              if (isMuslim) {
                return !subjectLower.includes('hindi') || subjectLower.includes('arabic-hindi');
              }
              
              // For non-Muslim students, exclude Arabic-Hindi
              return !subjectLower.includes('arabic-hindi');
            });
          }
          
          // Then filter the fullMarks object
          Object.entries(examConfig.fullMarks).forEach(([subject, marks]) => {
            const subjectLower = subject.toLowerCase();
            let shouldInclude = true;
            
            // Apply filtering based on religion
            if (!student.religion) {
              // If religion is not specified, exclude Arabic-Hindi
              shouldInclude = !subjectLower.includes('arabic-hindi');
            } else if (isMuslim) {
              // For Muslim students, exclude Hindi but include Arabic-Hindi
              shouldInclude = !subjectLower.includes('hindi') || subjectLower.includes('arabic-hindi');
            } else {
              // For non-Muslim students, exclude Arabic-Hindi
              shouldInclude = !subjectLower.includes('arabic-hindi');
            }
            
            if (shouldInclude) {
              filteredFullMarks[subject] = marks;
            }
          });
          
          // Update the examConfig with filtered subjects
          examConfig.fullMarks = filteredFullMarks;
          
          // Filter subjectMarksConfig to only include filtered subjects
          if (examConfig.subjectMarksConfig) {
            const filteredSubjectMarksConfig = {};
            Object.entries(examConfig.subjectMarksConfig).forEach(([subject, config]) => {
              const subjectLower = subject.toLowerCase();
              let shouldInclude = true;
              
              if (!student.religion) {
                shouldInclude = !subjectLower.includes('arabic-hindi');
              } else if (isMuslim) {
                shouldInclude = !subjectLower.includes('hindi') || subjectLower.includes('arabic-hindi');
              } else {
                shouldInclude = !subjectLower.includes('arabic-hindi');
              }
              
              if (shouldInclude) {
                filteredSubjectMarksConfig[subject] = config;
              }
            });
            examConfig.subjectMarksConfig = filteredSubjectMarksConfig;
          }
          
          // Remove schedule as it's not needed in marks panel
          if (examConfig.schedule) {
            delete examConfig.schedule;
          }
        }
        
        return {
          ...student,
          examConfig: examConfig
        };
      });
      
      console.log('Processed students with exam config:', processed);
      
      setProcessedStudents(processed);
      
      // Continue with method marks calculation
      // Process the first student to get method marks
      const firstStudent = processed[0] || {};
      const newMethodMarks = {};

      if (
        firstStudent.marks &&
        typeof firstStudent.marks === "object" &&
        selectedExam in firstStudent.marks
      ) {
        const examData = firstStudent.marks[selectedExam];

        if (examData && typeof examData === "object") {
          Object.entries(examData).forEach(([subject, methods]) => {
            if (methods && typeof methods === "object") {
              Object.entries(methods).forEach(([method, mark]) => {
                if (method !== "SubjectTotal" && !newMethodMarks[method]) {
                  newMethodMarks[method] = { total: 0, max: 0 };
                }
              });
            }
          });
        }
      }

      // Use functional update to ensure we're working with the latest state
      setMethodMarks((prevMethodMarks) => {
        // Only update if the new method marks are different from the previous ones
        return JSON.stringify(prevMethodMarks) !==
          JSON.stringify(newMethodMarks)
          ? newMethodMarks
          : prevMethodMarks;
      });
    }
  }, [students, selectedExam, classConfig]); // Added classConfig to dependencies

  // Fetch class configuration
  useEffect(() => {
    const fetchClassConfig = async () => {
      if (!selectedClass) return;
      setIsConfigLoading(true);
      setConfigError(null);
      try {
        const response = await getExamConfig(selectedClass, academicYear);
        console.log("examconfig data marks panel", response);

        // Handle different response formats
        let configData = response?.data || response;

        if (response && typeof response === "object" && "success" in response) {
          if (!response.success) {
            throw new Error(
              response.message || "Failed to load exam configuration"
            );
          }
          configData = response.data || {};
        }

        if (!configData) {
          throw new Error("No configuration data received");
        }

        const examConfig = configData.examConfig || {};

        console.log(
          "✅ [MarksPanel] getExamConfig Success - Class:",
          selectedClass
        );
        setClassConfig(configData);

        // Extract exam names from the configuration
        const examNames = Object.keys(examConfig);
        setExams(examNames);

        // If no exam is selected, select the first one
        if (examNames.length > 0 && !selectedExam) {
          setSelectedExam(examNames[0]);
        }
      } catch (err) {
        console.error("❌ [MarksPanel] Error fetching class config:", err);
        setConfigError(err.message || "Failed to load exam configuration");
        setExams([]);
        setSubjects([]);
        setExamConfigs({});
        setFullMarks({});
      } finally {
        setIsConfigLoading(false);
      }
    };

    fetchClassConfig();
  }, [selectedClass, academicYear, selectedExam]);

  // Process class config to extract subjects and exam methods
  useEffect(() => {
    try {
      if (classConfig && selectedExam) {
        const currentExam = classConfig.examConfig?.[selectedExam];

        if (currentExam) {
          // Extract subjects and their evaluation methods
          const subjectNames = Object.keys(currentExam.fullMarks || {});
          setSubjects(subjectNames);

          // Process subject marks configuration
          const evalConfigs = subjectNames.map((subject) => {
            const methods = currentExam.fullMarks[subject] || {};
            return {
              subject,
              methods: Object.keys(methods).filter((m) => m !== "SubjectTotal"),
            };
          });

          setExamConfigs((prevConfigs) => ({
            ...prevConfigs,
            [selectedExam]: evalConfigs,
          }));

          // Calculate full marks for the selected exam
          const calculateFullMarks = (examName, subjectList, config) => {
            if (!config || !config.examConfig || !config.examConfig[examName]) {
              return 0;
            }

            const examConfig = config.examConfig[examName];
            let total = 0;

            subjectList.forEach((subject) => {
              const subjectConfig = examConfig.fullMarks?.[subject];
              if (subjectConfig) {
                // Sum all evaluation types for this subject
                Object.values(subjectConfig).forEach((mark) => {
                  if (typeof mark === "number") {
                    total += mark;
                  }
                });
              }
            });

            return total;
          };

          const examTotal = calculateFullMarks(
            selectedExam,
            subjectNames,
            classConfig
          );
          setFullMarks((prev) => ({
            ...prev,
            [selectedExam]: examTotal,
          }));
        }
      } else {
        setSubjects([]);
        setExamConfigs({});
        setFullMarks({});
      }
    } catch (error) {
      console.error("Error processing class config:", error);
      setSubjects([]);
      setExamConfigs({});
      setFullMarks({});
    }
  }, [classConfig, selectedExam]);

  // Update selected exam if current selection is no longer valid
  useEffect(() => {
    if (exams.length > 0 && (!selectedExam || !exams.includes(selectedExam))) {
      const newExam = exams[0] || "";
      setSelectedExam(newExam);
      if (typeof window !== "undefined" && newExam) {
        localStorage.setItem("ui.selectedExam", newExam);
      }
    }
  }, [exams, selectedExam]);

  // Fetch students when class or exam changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedExam) return;

      setLoading(true);
      setError(null);

      try {
        console.log(
          "Fetching students for class:",
          selectedClass,
          "exam:",
          selectedExam
        );
        const data = await getStudentsByClass(selectedClass, selectedExam);
        console.log("Received students data:", data);
        
        // Preserve academicRanks and ensure proper formatting
        const studentsWithRanks = Array.isArray(data) 
          ? data.map(student => ({
              ...student,
              academicRanks: student.academicRanks || {}
            }))
          : [];
          
        const processedStudents = calculateRanks(studentsWithRanks, selectedExam);
        setStudents(processedStudents);
      } catch (e) {
        console.error("Error fetching students:", e);
        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedExam]);

  // Handle class selection
  const handleClassSelect = (className) => {
    setSelectedClass(className);
    setSelectedExam("");
    setStudents([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("ui.selectedClass", className);
      localStorage.removeItem("ui.selectedExam");
    }
  };

  // Handle edit marks
  const handleEditMarks = (student) => {
    setEditingStudent(student);
    // Pass the student's exam config to the modal
    setEditingExamConfig(student.examConfig || classConfig?.examConfig?.[selectedExam]);

    // Extract and format marks for the selected exam
    const examMarks = student.marks[selectedExam] || {};
    const formattedMarks = {};

    // Process each subject's marks
    subjects.forEach((subject) => {
      if (examMarks[subject] !== undefined) {
        // If marks are in object format (with methods), use as is
        if (
          typeof examMarks[subject] === "object" &&
          examMarks[subject] !== null
        ) {
          formattedMarks[subject] = { ...examMarks[subject] };
        }
        // If marks are in simple format, convert to object with default method
        else if (
          typeof examMarks[subject] === "string" ||
          typeof examMarks[subject] === "number"
        ) {
          const markValue = examMarks[subject];
          formattedMarks[subject] = {
            Written: markValue === "AB" ? "AB" : parseFloat(markValue) || 0,
          };
        }
      }
    });

    setEditingMarks(formattedMarks);

    // Open the modal
    setShowMarksModal(true);
  };
  // Handle save marks
  const handleSaveMarks = async (updatedMarks) => {
    if (!editingStudent || !selectedClass || !selectedExam) return;

    try {
      setSubmitting(true);

      // Prepare the data in the format expected by the API
      const updateData = {
        studentName: editingStudent.studentName,
        roll: editingStudent.roll,
        marks: {
          [selectedExam]: updatedMarks,
        },
      };

      // Call the API to update marks
      await bulkUpdateMarks(selectedClass, selectedExam, [updateData]);

      // Refresh the student data
      const data = await getStudentsByClass(selectedClass, selectedExam);
      const processedStudents = calculateRanks(
        Array.isArray(data) ? data : [],
        selectedExam
      );
      setStudents(processedStudents);

      // Close the modal
      setShowMarksModal(false);

      return true;
    } catch (error) {
      console.error("Error updating marks:", error);
      setError(error.message || "Failed to update marks");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Excel import
  const handleExcelImport = async (importedData, evaluationType = 'written') => {
    if (!selectedClass || !selectedExam) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Processing imported data:', importedData, 'with evaluation type:', evaluationType);
      
      // Process the imported data
      const updates = [];

      for (const item of importedData) {
        // Skip if roll is missing
        if (!item.roll) {
          console.warn('Skipping item with missing roll:', item);
          continue;
        }

        // Find the student by roll (case-insensitive)
        const student = students.find(s => 
          String(s.roll).toLowerCase() === String(item.roll).toLowerCase()
        );

        if (!student) {
          console.warn(`No student found with roll: ${item.roll}`);
          continue;
        }

        // Create update object with marks directly in the root
        const update = {
          roll: String(item.roll), // Ensure roll is a string
          studentName: item.studentName || student.studentName || '',
        };

        // Process each mark
        Object.entries(item).forEach(([key, value]) => {
          // Skip non-mark fields
          if (['roll', 'studentName', 'id', 'class', 'marks'].includes(key.toLowerCase())) return;
          
          // Only include marks for subjects that exist in the current exam config
          if (subjects.includes(key)) {
            // If the value is empty, skip it
            if (value === undefined || value === null || value === '') {
              return;
            }
            
            // If value is already an object with evaluation type, use it as is
            if (typeof value === 'object' && !Array.isArray(value)) {
              update[key] = value;
            } 
            // Otherwise, wrap it in an object with the current evaluation type
            else {
              update[key] = { [evaluationType]: value };
            }
          }
        });

        console.log('Processed update for roll', update.roll, ':', JSON.stringify(update, null, 2));
        updates.push(update);
      }

      console.log('Processed updates:', JSON.stringify(updates, null, 2));

      if (updates.length === 0) {
        throw new Error("No valid student records found for import");
      }

      // Call the API to update marks in bulk
      await bulkUpdateMarks(selectedClass, selectedExam, updates);

      // Refresh the student data
      const data = await getStudentsByClass(selectedClass, selectedExam);
      const processedStudents = calculateRanks(
        Array.isArray(data) ? data : [],
        selectedExam
      );
      setStudents(processedStudents);

      return true;
    } catch (error) {
      console.error("Error importing marks:", error);
      setError(error.message || "Failed to import marks");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle exam config visibility
  const toggleExamConfig = () => {
    setShowExamConfig(!showExamConfig);
  };

  // Process subject marks configuration
  const subjectMarksConfig = useMemo(() => {
    if (!classConfig || !selectedExam) return {};

    const config = {};
    const examConfig = classConfig.examConfig?.[selectedExam];

    if (!examConfig || !examConfig.fullMarks) return {};

    Object.entries(examConfig.fullMarks).forEach(([subject, methods]) => {
      config[subject] = { ...methods };
    });

    return config;
  }, [classConfig, selectedExam]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Marks Management
            </h2>
            {selectedClass && selectedExam && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedClass} - {selectedExam}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
           
            {students.length > 0 && (
              <button
                onClick={() => setShowExcelImportModal(true)}
                disabled={!selectedClass || loading}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-all ${
                  selectedClass && !loading
                    ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                title={!selectedClass ? "Please select a class first" : ""}
              >
                <FiUpload className="text-base" />
                Import Marks
              </button>
            )}
          </div>
        </div>

     

        <div className="space-y-4">
          {/* Class Selector Row */}
          <div className="w-full">
            <ExamDependentClassSelectorCard
              onSelect={handleClassSelect}
              selectedClass={selectedClass}
              title="Select Class for Marks Entry"
              showConfigMessage={true}
            />

            {/* Exam Selector */}
            {selectedClass && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Exam:
                </label>
                {isConfigLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="text-sm text-gray-500">
                      Loading exams...
                    </span>
                  </div>
                ) : configError ? (
                  <div className="text-red-500 text-sm">{configError}</div>
                ) : exams.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {exams.map((exam) => (
                      <button
                        key={exam}
                        onClick={() => {
                          setSelectedExam(exam);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("ui.selectedExam", exam);
                          }
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-150 font-medium whitespace-nowrap ${
                          selectedExam === exam
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        {exam}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-amber-600 dark:text-amber-400 text-sm">
                    No exams available for the selected class. Please configure
                    exams first.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {!selectedClass ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No class selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Select a class to view student marks
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-6">
                <div className="animate-pulse flex flex-col items-center justify-center space-y-6 py-8">
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: "1s",
                          animationIterationCount: "infinite",
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Loading Student Data
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please wait while we fetch the latest information
                    </p>
                  </div>
                </div>

                {/* Skeleton loader for content area */}
                <div className="mt-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-2">
              {processedStudents.length > 0 ? (
                // Sort processed students by roll number before mapping
                [...processedStudents]
                  .sort((a, b) => {
                    // First sort by roll number
                    const rollA = parseInt(a.roll) || 0;
                    const rollB = parseInt(b.roll) || 0;
                    if (rollA !== rollB) return rollA - rollB;
                    // If roll numbers are the same, sort by name
                    return a.studentName.localeCompare(b.studentName);
                  })
                  .map((student, index) => {
                    // Initialize exam marks from student.marks
                    const examMarks = {};
                    const examData = student.marks?.[selectedExam] || student.marks || {};

                    // Process marks based on examConfig
                    if (student.examConfig?.fullMarks) {
                      // First, handle the case where marks are in the format { subject: { written: X, oral: Y } }
                      if (examData && typeof examData === 'object' && !Array.isArray(examData)) {
                        Object.entries(examData).forEach(([subject, markData]) => {
                          if (markData && typeof markData === 'object' && !Array.isArray(markData)) {
                            // Handle nested mark structure (e.g., { written: '20', oral: '10' })
                            let subjectTotal = 0;
                            const subjectConfig = student.examConfig.fullMarks[subject] || {};
                            
                            // Process each evaluation type (written, oral, etc.)
                            Object.entries(markData).forEach(([type, mark]) => {
                              if (type.toLowerCase() !== 'subjecttotal') {
                                const markValue = extractMarkValue(mark);
                                const numMark = Number(markValue) || 0;
                                const maxMark = Number(subjectConfig[type] || 0);
                                
                                // Store individual method marks
                                const methodKey = `${subject} - ${type}`;
                                examMarks[methodKey] = markValue;
                                // Update method marks summary
                                if (!methodMarksRef.current[type]) {
                                  methodMarksRef.current[type] = { total: 0, max: 0 };
                                }
                                methodMarksRef.current[type].total += Math.min(numMark, maxMark);
                                methodMarksRef.current[type].max += maxMark;
                                
                                // Update subject total (capped at max mark)
                                subjectTotal += Math.min(numMark, maxMark);
                              }
                            });
                            
                            // Store the calculated subject total
                            examMarks[subject] = subjectTotal;
                          }
                        });
                      }
                      
                      // Also process the old format for backward compatibility
                      Object.entries(student.examConfig.fullMarks).forEach(
                        ([subject, methods]) => {
                          if (methods && typeof methods === "object") {
                            // For each method in the subject
                            Object.entries(methods).forEach(
                              ([method, maxMark]) => {
                                if (method !== "SubjectTotal") {
                                  // Get the mark value from examData (check both formats)
                                  let markValue = examData[subject]?.[method];
                                  if (markValue === undefined && examData[subject]?.[method.toLowerCase()] !== undefined) {
                                    markValue = examData[subject][method.toLowerCase()];
                                  }
                                  
                                  if (markValue !== undefined) {
                                    const formattedMark = extractMarkValue(markValue);
                                    examMarks[`${subject} - ${method}`] = formattedMark;
                                    
                                    // Add to method marks summary
                                    if (!methodMarksRef.current[method]) {
                                      methodMarksRef.current[method] = { total: 0, max: 0 };
                                    }
                                    const numMark = Number(formattedMark) || 0;
                                    methodMarksRef.current[method].total += Math.min(numMark, Number(maxMark) || 0);
                                    methodMarksRef.current[method].max += Number(maxMark) || 0;
                                  }
                                }
                              }
                            );
                            
                            // Calculate subject total if not already set
                            if (examMarks[subject] === undefined) {
                              if (examData[subject]?.SubjectTotal !== undefined) {
                                examMarks[subject] = extractMarkValue(examData[subject].SubjectTotal);
                              } else if (examData[subject] && typeof examData[subject] === 'object' && !Array.isArray(examData[subject])) {
                                // Sum all method marks for the subject
                                const subjectTotal = Object.entries(examData[subject])
                                  .filter(([key]) => key.toLowerCase() !== 'subjecttotal')
                                  .reduce((sum, [_, mark]) => {
                                    const value = extractMarkValue(mark);
                                    return sum + (isNaN(value) ? 0 : Number(value));
                                  }, 0);
                                examMarks[subject] = subjectTotal;
                              }
                            }
                          }
                        }
                      );
                    } else {
                      // Fallback: process all top-level subjects in examData
                      Object.entries(examData).forEach(([key, value]) => {
                        if (key !== '_id' && key !== 'studentId' && key !== 'exam' && key !== 'class') {
                          examMarks[key] = extractMarkValue(value);
                        }
                      });
                    }

                    // Initialize method marks and totals
                    methodMarksRef.current = {}; // Reset method marks for this student
                    let totalMarks = 0;
                    let totalPossibleMarks = 0;
                    let absentCount = 0;

                    // Get subjects from examConfig or use all subjects with marks
                    const subjectsToProcess = student.examConfig?.subjects || 
                                           Object.keys(student.examConfig?.fullMarks || {});
                    
                    if (subjectsToProcess.length === 0) return null; // Skip if no subjects to process

                    // Calculate subject totals and method marks
                    subjectsToProcess.forEach((subject) => {
                      const subjectMarks = examMarks[subject];
                      const subjectConfig = student.examConfig?.fullMarks?.[subject] || {};
                      
                      // Check if the student is absent for this subject
                      const isAbsent = subjectMarks === 'AB' || 
                                     (typeof subjectMarks === 'string' && subjectMarks.toUpperCase() === 'AB');
                      
                      if (isAbsent) {
                        absentCount++;
                        return; // Skip further processing for absent students
                      }

                      // Process subject with evaluation methods if available
                      if (Object.keys(subjectConfig).length > 0) {
                        let subjectTotal = 0;
                        let subjectMaxTotal = 0;
                        let hasMethodMarks = false;

                        // Process each evaluation method for the subject
                        Object.entries(subjectConfig).forEach(([method, maxMark]) => {
                          if (method === 'SubjectTotal') return; // Skip SubjectTotal in config
                          
                          const methodKey = `${subject} - ${method}`;
                          const mark = examMarks[methodKey];
                          
                          if (mark !== undefined) {
                            hasMethodMarks = true;
                            const numMark = Number(mark) || 0;
                            const numMaxMark = Number(maxMark) || 0;
                            
                            // Update method marks
                            if (!methodMarksRef.current[method]) {
                              methodMarksRef.current[method] = { total: 0, max: 0 };
                            }
                            methodMarksRef.current[method].total += numMark;
                            methodMarksRef.current[method].max += numMaxMark;
                            
                            // Update subject totals
                            subjectTotal += numMark;
                            subjectMaxTotal += numMaxMark;
                          }
                        });

                        // If we have method marks, use them for the subject total
                        if (hasMethodMarks) {
                          totalMarks += subjectTotal;
                          totalPossibleMarks += subjectMaxTotal;
                          return;
                        }
                      }
                      
                      // Fallback to direct subject mark if no method marks found
                      if (subjectMarks !== undefined) {
                        const numMark = Number(subjectMarks) || 0;
                        // Get max mark from examConfig or use a default value
                        const maxMark = student.examConfig?.fullMarks?.[subject]?.SubjectTotal || 
                                     (subjectConfig.SubjectTotal || 100);
                        
                        totalMarks += numMark;
                        totalPossibleMarks += maxMark;
                      }
                    });

                    // Calculate subject totals from the processed data
                    const subjectTotals = {};
                    // Reset totalPossibleMarks before calculating
                    totalPossibleMarks = 0;
                    
                    // Get the subjects and evaluation types from examConfig
                    const subjects = student.examConfig?.subjects || [];
                    const evaluationTypes = student.examConfig?.evaluationTypes || [];
                    
                    console.group('=== Marks Calculation Debug ===');
                    console.log('Student:', student.studentName, 'Roll:', student.roll);
                    console.log('Subjects:', subjects);
                    console.log('Evaluation types:', evaluationTypes);
                    
                    // Calculate total possible marks
                    subjects.forEach(subject => {
                      const subjectConfig = student.examConfig?.fullMarks?.[subject] || {};
                      console.group(`Subject: ${subject}`);
                      
                      // Calculate max marks for this subject
                      let subjectMax = 0;
                      const evaluationMarks = {};
                      
                      // Sum up marks for each evaluation type
                      evaluationTypes.forEach(type => {
                        const markValue = Number(subjectConfig[type] || 0);
                        if (!isNaN(markValue) && markValue > 0) {
                          subjectMax += markValue;
                          evaluationMarks[type] = markValue;
                        } else {
                          evaluationMarks[type] = 0;
                        }
                      });
                      
                      // If we couldn't calculate from evaluation types, try to get SubjectTotal
                      if (subjectMax === 0 && subjectConfig.SubjectTotal) {
                        subjectMax = Number(subjectConfig.SubjectTotal) || 0;
                        console.log('Using SubjectTotal:', subjectConfig.SubjectTotal);
                      }
                      
                      // Add to total possible marks
                      totalPossibleMarks += subjectMax;
                      
                      console.log('Evaluation marks:', evaluationMarks);
                      console.log('Subject max marks:', subjectMax);
                      console.groupEnd(); // End subject group
                    });
                    
                    // Log final summary
                    console.log('=== FINAL SCORE ===');
                    console.log('Student:', student.studentName);
                    console.log('Roll:', student.roll);
                    console.log('Total Marks:', totalMarks);
                    console.log('Total Possible Marks:', totalPossibleMarks);
                    console.log('Percentage:', totalPossibleMarks > 0 ? (totalMarks / totalPossibleMarks * 100).toFixed(1) + '%' : '0%');
                    console.log('==================');
                    console.groupEnd(); // End main group
                    
                    // Reset totals before calculating
                    totalMarks = 0;
                    totalPossibleMarks = 0;
                    
                    // Process each subject for the student
                    subjectsToProcess.forEach(subject => {
                      const subjectConfig = student.examConfig?.fullMarks?.[subject] || {};
                      
                      // Get marks for this subject from student's marks
                      const examMarks = student.marks?.[selectedExam] || {};
                      const subjectMark = examMarks[subject] || {};
                      
                      // Skip if no config for this subject
                      if (Object.keys(subjectConfig).length === 0) return;
                      
                      // Calculate marks
                      let subjectMaxMarks = 0;
                      let obtainedMarks = 0;
                      let isAbsent = false;
                      const marksBreakdown = {};
                      
                      // Process each evaluation type
                      if (student.examConfig?.evaluationTypes) {
                        student.examConfig.evaluationTypes.forEach(type => {
                          // Get max mark for this evaluation type
                          const maxMark = Number(subjectConfig[type] || 0);
                          subjectMaxMarks += maxMark;
                          
                          // Get obtained mark for this evaluation type
                          let obtainedMark = 0;
                          
                          // Try different variations of the mark key
                          const markValue = subjectMark[type] || subjectMark[type.toLowerCase()] || 0;
                          
                          // Check for absent
                          if (String(markValue).toUpperCase() === 'AB') {
                            isAbsent = true;
                          }
                          
                          // Convert to number and ensure it's valid
                          obtainedMark = isNaN(Number(markValue)) ? 0 : Number(markValue);
                          
                          // Store the breakdown for rendering
                          marksBreakdown[type] = {
                            obtained: obtainedMark,
                            max: maxMark,
                            isAbsent: String(markValue).toUpperCase() === 'AB'
                          };
                          
                          // Add to obtained marks if not absent
                          if (!isAbsent) {
                            obtainedMarks += obtainedMark;
                          }
                        });
                      }
                      
                      // Store the subject total
                      subjectTotals[subject] = {
                        obtained: isAbsent ? 0 : obtainedMarks,
                        max: subjectMaxMarks,
                        isAbsent: isAbsent,
                        breakdown: marksBreakdown
                      };
                      
                      // Update totals if not absent
                      if (!isAbsent) {
                        totalMarks += obtainedMarks;
                        totalPossibleMarks += subjectMaxMarks;
                      }
                      
                      // Debug log for the subject
                      console.log(`[${subject}] Total: ${isAbsent ? 'AB' : obtainedMarks}/${subjectMaxMarks}`, marksBreakdown);
                      Object.entries(marksBreakdown).forEach(([type, marks]) => {
                        console.log(`  ${type}: ${marks.isAbsent ? 'AB' : marks.obtained}/${marks.max}`);
                      });
                    });

                    // If still 0, use a default value based on number of subjects and evaluation types
                    if (totalPossibleMarks === 0 && subjectsToProcess.length > 0) {
                      const evaluationTypeCount = student.examConfig?.evaluationTypes?.length || 2; // Default to 2 (written/oral)
                      const defaultMarksPerSubject = evaluationTypeCount * 50; // 50 per evaluation type
                      totalPossibleMarks = subjectsToProcess.length * defaultMarksPerSubject;
                      
                      // Log a warning if we had to use default values
                      console.warn('Using default marks calculation. Please check subject configurations.');
                    }

                    // Calculate percentage with proper bounds checking
                    let percentage = 0;
                    if (totalPossibleMarks > 0) {
                      // Ensure we don't exceed 100% or go below 0%
                      const rawPercentage = (Math.min(totalMarks, totalPossibleMarks) / totalPossibleMarks) * 100;
                      percentage = Math.min(100, Math.max(0, Math.round(rawPercentage * 10) / 10)); // Round to 1 decimal place
                    }
                    
                    // Log for debugging
                    console.log('Total Marks:', totalMarks, 'Total Possible:', totalPossibleMarks, 'Percentage:', percentage);

                    return (
                      <div
                        key={student._id}
                        className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 transform hover:-translate-y-0.5 hover:scale-[1.02] p-0"
                      >
                        {/* Header with student info */}
                        <div className="bg-gradient-to-r from-purple-600 to-violet-700 dark:from-purple-800 dark:to-violet-900 rounded-t-2xl text-white p-4">
                          <div className="flex w-full justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base break-words whitespace-normal text-white">
                                {student.studentName}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium text-white">
                                  Roll: {student.roll || "N/A"}
                                </span>
                                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium text-white">
                                  {student.class}
                                </span>
                              </div>
                            </div>
                            <div>
                              {/* Status indicator removed as per request */}
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="text-2xl font-bold text-right text-white">
                                {Math.round(totalMarks)}
                                <span className="text-sm font-normal text-white/80">
                                  /{totalPossibleMarks}
                                </span>
                              </div>
                              <div className="text-xs text-white/80 flex flex-col items-end">
                                {student.rank ? (
                                  <>
                                    <span>Rank: {student.rank} of {student.totalStudents || "--"}</span>
                                  </>
                                ) : (
                                  <span>Calculating rank...</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Exam Info Header */}
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                          <div className="text-center">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                              {student.examConfig?.examName || selectedExam}
                            </h3>
                          </div>
                        </div>

                        {/* Subject Marks Grid */}
                        <div className="p-0">
                          <div className="grid grid-cols-2 gap-3">
                            {student.examConfig?.subjects?.map((subject) => {
                              // Get the subject's configuration
                              const subjectConfig =
                                student.examConfig?.subjectMarksConfig?.[subject] || 
                                subjectMarksConfig[subject] || {};

                              // Get evaluation types for this subject
                              const evaluationTypes = Object.keys(
                                subjectConfig
                              ).filter(
                                (key) =>
                                  ![
                                    "SubjectTotal",
                                    "examDateOfThisSubject",
                                    "startTime",
                                    "endTime",
                                  ].includes(key)
                              );

                              // Reset variables for this subject
                              let subjectTotal = 0;
                              let subjectMax = 0;
                              let isAbsent = false;
                              const marksBreakdown = {};

                              // Get the marks for this subject from the student's marks
                              const examMarks = student.marks?.[selectedExam] || {};
                              const subjectMarks = examMarks[subject];
                              
                              // Get the full marks configuration for this subject
                              const subjectFullMarks = student.examConfig?.fullMarks?.[subject] || {};
                              
                              // Calculate maximum possible marks and process obtained marks
                              if (student.examConfig?.evaluationTypes) {
                                student.examConfig.evaluationTypes.forEach(type => {
                                  // Get max mark for this evaluation type
                                  const maxMark = Number(subjectFullMarks[type] || 0);
                                  subjectMax += maxMark;
                                  
                                  // Get obtained mark for this evaluation type
                                  let obtainedMark = 0;
                                  let markValue = 0;
                                  
                                  // Try to get the mark from subjectMarks object
                                  if (subjectMarks && typeof subjectMarks === 'object') {
                                    markValue = subjectMarks[type] || subjectMarks[type.toLowerCase()] || 0;
                                  }
                                  
                                  // Check for absent
                                  if (String(markValue).toUpperCase() === 'AB') {
                                    isAbsent = true;
                                    marksBreakdown[type] = { obtained: 0, max: maxMark, isAbsent: true };
                                  } else {
                                    // Convert to number and ensure it's valid
                                    obtainedMark = isNaN(Number(markValue)) ? 0 : Number(markValue);
                                    subjectTotal += obtainedMark;
                                    marksBreakdown[type] = { obtained: obtainedMark, max: maxMark, isAbsent: false };
                                  }
                                });
                              }
                              
                              // If no evaluation types, try to get total directly
                              if (subjectMax === 0 && subjectFullMarks.SubjectTotal) {
                                subjectMax = Number(subjectFullMarks.SubjectTotal) || 0;
                                if (subjectMarks) {
                                  if (typeof subjectMarks === 'object') {
                                    // Sum all numeric values if it's an object
                                    Object.entries(subjectMarks).forEach(([type, mark]) => {
                                      if (type.toLowerCase() !== 'subjecttotal') {
                                        const markValue = extractMarkValue(mark);
                                        if (!isNaN(Number(markValue)) && String(markValue).toUpperCase() !== 'AB') {
                                          subjectTotal += Number(markValue);
                                        }
                                      }
                                    });
                                  } else {
                                    // Single value
                                    const markValue = extractMarkValue(subjectMarks);
                                    if (String(markValue).toUpperCase() === 'AB') {
                                      isAbsent = true;
                                      subjectTotal = 0;
                                    } else {
                                      subjectTotal = isNaN(Number(markValue)) ? 0 : Number(markValue);
                                    }
                                  }
                                }
                              }

                              // Log the marks for debugging
                              console.group(`Subject: ${subject}`);
                              console.log('Marks:', subjectMarks);
                              console.log('Max Marks:', subjectMax);
                              console.log('Breakdown:', marksBreakdown);
                              console.groupEnd();

                              // Calculate subject percentage if max marks are available
                              const subjectPercentage =
                                subjectMax > 0
                                  ? Math.round(
                                      (subjectTotal / subjectMax) * 100
                                    )
                                  : 0;

                              return (
                                <div
                                  key={subject}
                                  className="subject-card bg-white dark:bg-gray-800/50 p-2.5 rounded-lg transition-all duration-200 hover:shadow-md flex flex-col border border-gray-100 dark:border-gray-700/50 shadow-sm"
                                >
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="font-medium text-[13px] text-gray-800 dark:text-gray-100 truncate pr-2">
                                        {subject}
                                      </span>
                                      <span className="text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                                        <span
                                          className={
                                            isAbsent
                                              ? "text-red-500 dark:text-red-400"
                                              : "text-purple-700 dark:text-purple-300"
                                          }
                                        >
                                          {isAbsent ? "AB" : subjectTotal}
                                        </span>
                                        <span className="text-purple-500/80 dark:text-purple-300/70">
                                          /{subjectMax}
                                        </span>
                                      </span>
                                    </div>

                                    {/* Subject Progress Bar */}
                                    <div className="w-full mt-1.5 mb-2">
                                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                        <div 
                                          className={`h-1.5 rounded-full ${
                                            subjectPercentage >= 80
                                              ? 'bg-green-500'
                                              : subjectPercentage >= 50
                                              ? 'bg-blue-500'
                                              : 'bg-yellow-500'
                                          }`}
                                          style={{ width: `${Math.min(100, Math.max(0, subjectPercentage))}%` }}
                                        ></div>
                                      </div>
                                    </div>

                                    {evaluationTypes.length > 0 && (
                                      <div className="space-y-1">
                                        {evaluationTypes.map(type => {
                                          // Get the mark for this evaluation type
                                          const mark = subjectMarks?.[type] || subjectMarks?.[type.toLowerCase()] || 0;
                                          const markValue = extractMarkValue(mark);
                                          
                                          // Get max mark for this evaluation type
                                          let maxMark = 0;
                                          
                                          // First try to get from fullMarks
                                          if (subjectFullMarks) {
                                            maxMark = Number(subjectFullMarks[type] || subjectFullMarks[type.toLowerCase()] || 0);
                                          }
                                          
                                          // Fallback to subjectConfig if no maxMark found
                                          if (maxMark === 0 && subjectConfig) {
                                            if (subjectConfig[type] !== undefined) {
                                              maxMark = Number(subjectConfig[type]) || 0;
                                            } else {
                                              const lowerType = type.toLowerCase();
                                              const matchingKey = Object.keys(subjectConfig).find(
                                                k => k.toLowerCase() === lowerType
                                              );
                                              if (matchingKey) {
                                                maxMark = Number(subjectConfig[matchingKey]) || 0;
                                              }
                                            }
                                          }
                                          
                                          const isAbsent = markValue === 'AB' || markValue === '0' || markValue === 0 || markValue === '';
                                          
                                          // Debug log for each evaluation type
                                          console.log(`Subject: ${subject}, Type: ${type}, Mark: ${markValue}, Max: ${maxMark}, Absent: ${isAbsent}`);
                                          
                                          return (
                                            <div key={type} className="flex justify-between items-center text-[11px]">
                                              <span className="text-gray-500 dark:text-gray-400 truncate pr-2">
                                                {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}:
                                              </span>
                                              <span className={`font-medium ${isAbsent ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'} flex-shrink-0`}>
                                                <span className={isAbsent ? 'line-through' : ''}>
                                                  {isAbsent ? 'AB' : markValue}
                                                </span>
                                                <span className="text-gray-400 dark:text-gray-500 text-[10px] ml-1">
                                                  /{maxMark > 0 ? maxMark : '0'}
                                                </span>
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="grid grid-cols-5 gap-2 items-center">
                              {/* Rank Section */}
                              <div className="col-span-2 flex items-center space-x-3">
                                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                                  #{student.rank || "--"}
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Rank
                                  </div>
                                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {student.rank
                                      ? `of ${student.totalStudents}`
                                      : "Not ranked"}
                                  </div>
                                </div>
                              </div>

                              {/* Overall Marks */}
                              <div className="col-span-3 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Overall:
                                  </span>
                                  <div className="text-right">
                                    <span className="text-base font-bold text-gray-900 dark:text-white">
                                      {Math.round(totalMarks)}/
                                      {Math.round(totalPossibleMarks)}
                                    </span>
                                    <span className="ml-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                      ({percentage}%)
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                  <div
                                    className={`h-full rounded-full ${
                                      percentage >= 80
                                        ? "bg-green-500"
                                        : percentage >= 50
                                        ? "bg-blue-500"
                                        : "bg-yellow-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>

                                {/* Performance Indicator */}
                                <div className="flex justify-between items-center">
                                  <span
                                    className={`text-xs font-medium ${
                                      percentage >= 80
                                        ? "text-green-600 dark:text-green-400"
                                        : percentage >= 50
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-yellow-600 dark:text-yellow-400"
                                    }`}
                                  >
                                    {percentage >= 80
                                      ? "Excellent"
                                      : percentage >= 50
                                      ? "Good"
                                      : "Needs Improvement"}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMarks(student);
                                }}
                                className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              >
                                Edit Marks
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No students found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No student records found for {selectedClass} -{" "}
                      {selectedExam}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Marks Modal */}
      {showExcelImportModal && (
        <ExcelImportModalforMarks
          isOpen={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
          selectedClass={selectedClass}
          selectedExam={selectedExam}
          classConfig={classConfig}  // Pass the entire classConfig
          title="Import Marks from Excel"
          selectedColumns={["Roll", "Student Name", ...subjects]}
          onImport={handleExcelImport}
          processedStudents={processedStudents}
          evaluationTypes={(() => {
            if (!classConfig?.examConfig?.[selectedExam]?.evaluationTypes) {
              // Fallback to default evaluation types if not specified
              return ['Written', 'Oral'];
            }
            return classConfig.examConfig[selectedExam].evaluationTypes;
          })()}
        />
      )}

      {/* Update Marks Modal */}
      <MarksUpdateModalV2
        isOpen={showMarksModal}
        onClose={() => setShowMarksModal(false)}
        student={editingStudent}
        examConfig={editingExamConfig}
        examName={selectedExam}
        subjects={subjects}
        examMethods={(() => {
          if (!classConfig?.examConfig?.[selectedExam]?.fullMarks) return [];

          // Get all unique method types from all subjects with their max marks
          const methodMap = new Map();
          const fullMarks = classConfig.examConfig[selectedExam].fullMarks;

          // First pass: collect all method types and their max marks
          Object.entries(fullMarks).forEach(([subject, subjectMarks]) => {
            if (typeof subjectMarks === "object" && subjectMarks !== null) {
              Object.entries(subjectMarks).forEach(([key, value]) => {
                if (
                  key !== "SubjectTotal" &&
                  key !== "examDateOfThisSubject" &&
                  key !== "startTime" &&
                  key !== "endTime"
                ) {
                  // Use the first non-zero value we find for each method type
                  if (value > 0 && !methodMap.has(key)) {
                    methodMap.set(key, value);
                  }
                }
              });
            }
          });

          // Convert to array of objects with type and marks
          return Array.from(methodMap.entries()).map(([type, marks]) => ({
            type,
            marks: Number(marks) || 0,
          }));
        })()}
        initialMarks={editingMarks}
        onSubmit={handleSaveMarks}
      />
    </div>
  );
}
