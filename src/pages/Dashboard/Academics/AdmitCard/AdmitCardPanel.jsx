import React, { useState, useEffect, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import * as ReactDOM from "react-dom/client";
import {
  FiFilter,
  FiSearch,
  FiPrinter,
  FiLoader,
  FiX,
  FiDownload,
  FiUpload,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiBookOpen,
  FiAward,
  FiInfo,
  FiClipboard,
} from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { format, parseISO, parse, isBefore } from "date-fns";
import { enIN } from "date-fns/locale/en-IN";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import AdmitPrintPage from "@/pages/Dashboard/Academics/AdmitCard/AdmitCardPage/AdmitPrintPage";
import ExamDependentClassSelectorCard from "@/components/common/ExamDependentClassSelectorCard";
import { getStudentsByClass } from "@/services/students";
import { getExamConfig, listExamConfigs } from "@/services/examConfig";
import AdmitPrintPreviewModal from "./Modals/AdmitPrintPreviewModal";
import AdmitPrintAllPreviewModal from "./Modals/AdmitPrintAllPreviewModal";
import { schoolinfo } from "@/shared/schoolInformation";

const AdmitCardPanel = () => {
  const [selectedClass, setSelectedClass] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ui.selectedClass") || null;
    }
    return null;
  });
  const [printPreviewStudent, setPrintPreviewStudent] = useState(null);
  const [processedStudents, setProcessedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exams, setExams] = useState([]);
  const [examConfigs, setExamConfigs] = useState({});
  const [classConfig, setClassConfig] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedExamConfig, setSelectedExamConfig] = useState(null);
  const [rawExamConfig, setRawExamConfig] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [printAllMode, setPrintAllMode] = useState(false);
  const [showPrintAllPreview, setShowPrintAllPreview] = useState(false);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const printAllRef = useRef();
  
  // Handle print all functionality
  const handlePrintAll = async () => {
    if (isOpeningModal) return;
    
    setIsOpeningModal(true);
    if (!processedStudents.length) {
      toast.error('No students available to print');
      return;
    }

    // Find the selected exam details
    const examDetails = exams.find(exam => exam._id === selectedExam);
    if (!examDetails) {
      toast.error('No exam selected or exam details not found');
      return;
    }

    setShowPrintAllPreview(true);
  };

  const handleClosePrintAllPreview = () => {
    setShowPrintAllPreview(false);
    setIsOpeningModal(false);
  };
  
  // Handle modal open with loading state
  const handleOpenPrintAllPreview = () => {
    setShowPrintAllPreview(true);
    // Reset loading state after modal is fully opened (handled by the modal's own loading state)
    const timer = setTimeout(() => {
      setIsOpeningModal(false);
    }, 500);
    return () => clearTimeout(timer);
  };

  // Define fetchExams
  const fetchExams = useCallback(
    async (classToFetch) => {
      const className = classToFetch || selectedClass;

      if (!className) {
        console.log("No class selected");
        setExams([]);
        return;
      }

      console.log(`Fetching exams for class: ${className}`);
      setLoading(true);

      try {
        console.log("Calling getExamConfig with class:", className);
        const response = await getExamConfig(className);
        console.log("Raw API Response:", JSON.stringify(response, null, 2));

        if (!response) {
          console.error("Empty response from getExamConfig");
          toast.error("Received empty response from server");
          setExams([]);
          return;
        }

        const config = response?.data || response;
        console.log("Processed Config:", JSON.stringify(config, null, 2));

        if (!config) {
          console.error("No config data found in response");
          toast.error("No exam configuration found");
          setExams([]);
          return;
        }

        // Store the raw exam config
        setRawExamConfig(config);
        console.log("Config data:", config);

        let formattedExams = [];

        // Check if we have examConfig in the response
        if (
          config &&
          config.examConfig &&
          typeof config.examConfig === "object"
        ) {
          console.log(
            "Processing exam config with",
            Object.keys(config.examConfig).length,
            "exams:",
            Object.keys(config.examConfig)
          );

          formattedExams = Object.entries(config.examConfig)
            .map(([examName, examData]) => {
              console.log(`Processing exam: ${examName}`, examData);

              if (!examData || typeof examData !== "object") {
                console.log(
                  `Skipping invalid exam data for ${examName}`,
                  examData
                );
                return null;
              }

              // Extract subjects and evaluation types
              const subjects = Array.isArray(examData.subjects)
                ? examData.subjects
                : [];

              const evaluationTypes = Array.isArray(examData.evaluationTypes)
                ? examData.evaluationTypes
                : [];

              const fullMarks = examData.fullMarks || {};
              const schedule = examData.schedule || {};

              // Count subjects from the subjects array or fullMarks object
              const subjectCount = Math.max(
                subjects.length,
                Object.keys(fullMarks).length
              );

              // Create a summary of the exam
              const examSummary = {
                _id: examName.replace(/\s+/g, "-").toLowerCase(),
                name: examName,
                subjectCount: subjectCount,
                evaluationTypes: [...new Set(evaluationTypes)],
                hasSchedule: schedule && Object.keys(schedule).length > 0,
                subjects: subjects,
                fullMarks: fullMarks,
                schedule: schedule,
                ...examData,
              };

              console.log(`Processed exam: ${examName}`, examSummary);
              return examSummary;
            })
            .filter(Boolean); // Remove any null entries

          console.log("Successfully processed", formattedExams.length, "exams");
        } else if (Array.isArray(config)) {
          console.log("Processing config as array");
          formattedExams = config.map((exam) => ({
            _id: (exam._id || exam.name || "")
              .replace(/\s+/g, "-")
              .toLowerCase(),
            name: exam.name || "Unnamed Exam",
            subjectCount: exam.subjects ? exam.subjects.length : 0,
            evaluationTypes: Array.isArray(exam.evaluationTypes)
              ? exam.evaluationTypes
              : [],
            hasSchedule: exam.schedule && Object.keys(exam.schedule).length > 0,
            ...exam,
          }));
        } else if (config && config.exams) {
          console.log("Processing config with exams array");
          formattedExams = Array.isArray(config.exams)
            ? config.exams.map((exam) => ({
                _id: (exam._id || exam.name || "")
                  .replace(/\s+/g, "-")
                  .toLowerCase(),
                name: exam.name || "Unnamed Exam",
                subjectCount: exam.subjects ? exam.subjects.length : 0,
                evaluationTypes: Array.isArray(exam.evaluationTypes)
                  ? exam.evaluationTypes
                  : [],
                hasSchedule:
                  exam.schedule && Object.keys(exam.schedule).length > 0,
                ...exam,
              }))
            : [];
        } else {
          console.log(
            "No exams found in config, falling back to listExamConfigs"
          );
          try {
            const response = await listExamConfigs();
            console.log("Exam data from listExamConfigs:", response);

            const responseData = response?.data || response;

            if (Array.isArray(responseData)) {
              // Filter exams for the selected class
              const classExams = responseData.filter(
                (exam) =>
                  exam && exam.className === selectedClass && exam.examConfig
              );

              console.log(
                `Found ${classExams.length} exam configs for class ${selectedClass}`
              );

              // Flatten the exam configs
              formattedExams = classExams.flatMap((classExam) => {
                if (
                  !classExam.examConfig ||
                  typeof classExam.examConfig !== "object"
                ) {
                  console.log("Skipping invalid exam config:", classExam);
                  return [];
                }

                return Object.entries(classExam.examConfig).map(
                  ([examName, examData]) => {
                    const subjects = Array.isArray(examData.subjects)
                      ? examData.subjects
                      : [];
                    const evaluationTypes = Array.isArray(
                      examData.evaluationTypes
                    )
                      ? examData.evaluationTypes
                      : [];
                    const fullMarks = examData.fullMarks || {};
                    const schedule = examData.schedule || {};

                    const examSummary = {
                      _id: examName.replace(/\s+/g, "-").toLowerCase(),
                      name: examName,
                      subjectCount: Math.max(
                        subjects.length,
                        Object.keys(fullMarks).length
                      ),
                      evaluationTypes: [...new Set(evaluationTypes)],
                      hasSchedule: schedule && Object.keys(schedule).length > 0,
                      subjects: subjects,
                      fullMarks: fullMarks,
                      schedule: schedule,
                      ...examData,
                    };

                    console.log(
                      `Processed exam from list: ${examName}`,
                      examSummary
                    );
                    return examSummary;
                  }
                );
              });

              console.log(
                "Final formatted exams from listExamConfigs:",
                formattedExams
              );
            }
          } catch (error) {
            console.error("Error fetching exam configs:", error);
            toast.error("Failed to load exam configurations");
          }
        }

        setExams(formattedExams);

        // If no exam is selected, select the first one
        if (formattedExams.length > 0 && !selectedExam) {
          console.log("No exam selected, selecting first available exam");
          setSelectedExam(formattedExams[0]._id);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast.error("Failed to load exams");
        setExams([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedClass]
  );

  // Call fetchExams when component mounts or when selectedClass changes
  useEffect(() => {
    console.log("Component mounted or selectedClass changed:", {
      selectedClass,
    });

    if (selectedClass) {
      console.log("Fetching exams for class:", selectedClass);
      fetchExams(selectedClass);
    } else {
      console.log("No class selected, clearing exams");
      setExams([]);
    }
  }, [selectedClass, fetchExams]);

  // Fetch students when selectedClass changes
  useEffect(() => {
    const fetchStudentsData = async () => {
      console.log("Selected class changed:", selectedClass);
      if (!selectedClass) {
        console.log("No class selected, clearing students");
        setStudents([]);
        return;
      }

      console.log("Starting to fetch students for class:", selectedClass);
      setLoading(true);
      try {
        console.log("Calling getStudentsByClass with class:", selectedClass);
        const response = await getStudentsByClass(selectedClass);
        console.log("Raw API response:", response);

        if (!response) {
          throw new Error("Empty response from server");
        }

        // The students service already processes the response into an array
        let studentsData = [];
        if (Array.isArray(response)) {
          studentsData = response;
        } else {
          console.warn(
            "Unexpected response format from getStudentsByClass:",
            response
          );
          // Try to extract students from common response formats
          if (response.data && Array.isArray(response.data)) {
            studentsData = response.data;
          } else if (response.students && Array.isArray(response.students)) {
            studentsData = response.students;
          } else if (response.results && Array.isArray(response.results)) {
            studentsData = response.results;
          } else {
            throw new Error("Could not parse students data from response");
          }
        }

        console.log(`Successfully processed ${studentsData.length} students`);
        setStudents(studentsData);
      } catch (error) {
        console.error("Error in fetchStudentsData:", {
          error,
          message: error.message,
          stack: error.stack,
          selectedClass,
        });
        toast.error(
          `Failed to load students: ${error.message || "Unknown error"}`
        );
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent rapid successive calls
    const timer = setTimeout(() => {
      fetchStudentsData().catch((err) => {
        console.error("Unhandled error in fetchStudentsData:", err);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedClass]);

  // Process students when class, students, or exam config changes
  useEffect(() => {
    if (students.length > 0 && selectedExam && exams.length > 0) {
      const processStudents = () => {
        const examDetails = exams.find(e => e._id === selectedExam);
        if (!examDetails) return [];

        // Filter raw exam config to only include data for the selected exam
        const examName = examDetails?.name || "Exam";
        const filteredRawExamConfig = rawExamConfig?.examConfig ? {
          examConfig: {
            [examName]: rawExamConfig.examConfig[examName]
          }
        } : null;

        return students.map(student => {
          const rawExamData = filteredRawExamConfig?.examConfig?.[examName];
          
          // Get subjects from raw exam config or exam details
          let subjects = [];
          if (rawExamData?.subjects) {
            subjects = [...rawExamData.subjects];
          } else if (examDetails?.subjects) {
            subjects = [...examDetails.subjects];
          }

          // Process subjects based on student's religion
          if (student.religion && subjects && subjects.length > 0) {
            const studentReligion = student.religion.trim().toUpperCase();
            console.log(`Processing student: ${student.studentName}, Religion: ${studentReligion}`);

            // Create a copy of the subjects array to avoid mutating the original
            let filteredSubjects = [...subjects];

            if (studentReligion === 'ISLAM') {
              console.log('Applying ISLAM religion filter - showing all subjects');
              // For ISLAM religion, show all subjects but convert Arabic-Hindi to Arabic
              filteredSubjects = filteredSubjects.map(subject => {
                const lowerSubject = subject.toLowerCase();
                const isArabicHindi = lowerSubject.includes('arabic-hindi') ||
                                   (lowerSubject.includes('arabic') && lowerSubject.includes('hindi'));

                if (isArabicHindi) {
                  console.log(`Converting subject from ${subject} to Arabic`);
                  return 'Arabic';
                }
                return subject;
              });
            } else {
              console.log(`Applying filter for religion: ${studentReligion} - showing all subjects except Arabic and Arabic-Hindi`);
              // For all other religions, show all subjects except Arabic and Arabic-Hindi
              filteredSubjects = filteredSubjects.filter(subject => {
                const lowerSubject = subject.toLowerCase();
                const isArabic = lowerSubject.includes('arabic') || 
                               (lowerSubject.includes('arabic') && lowerSubject.includes('hindi'));
                
                if (isArabic) {
                  console.log(`Excluding Arabic/Arabic-Hindi subject: ${subject}`);
                  return false;
                }
                return true;
              });
            }
          
            // Update the subjects array with the filtered/processed subjects
            subjects = filteredSubjects;
          }

          // Get fullMarks and schedule from raw exam data or exam details
          const fullMarks = rawExamData?.fullMarks || examDetails?.fullMarks || {};
          const schedule = rawExamData?.schedule || examDetails?.schedule || {};
          
          // Sort subjects by their written exam date using date-fns
          const sortedSubjects = [...subjects].sort((a, b) => {
            try {
              // Find the original subject names in case they were converted
              const getOriginalSubject = (subject) => {
                if (subject === 'Arabic') {
                  return Object.keys(schedule).find(s => 
                    s.toLowerCase().includes('arabic') && 
                    s.toLowerCase().includes('hindi')
                  ) || subject;
                }
                return subject;
              };
              
              const subjectA = getOriginalSubject(a);
              const subjectB = getOriginalSubject(b);
              
              const dateA = schedule[subjectA]?.Written?.examDate || schedule[subjectA]?.Written?.date;
              const dateB = schedule[subjectB]?.Written?.examDate || schedule[subjectB]?.Written?.date;
              
              console.log(`Comparing subjects: ${a} (${dateA}) and ${b} (${dateB})`);
              
              // If both have dates, compare them
              if (dateA && dateB) {
                const result = isBefore(parseISO(dateA), parseISO(dateB)) ? -1 : 1;
                console.log(`Comparison result: ${result}`);
                return result;
              }
              
              // Put subjects without dates at the end
              if (!dateA && !dateB) return a.localeCompare(b); // If both lack dates, sort alphabetically
              if (!dateA) return 1;
              if (!dateB) return -1;
              
              return 0;
            } catch (error) {
              console.error('Error sorting subjects:', error);
              return a.localeCompare(b); // Fallback to alphabetical sort on error
            }
          });
          
          // Update the subjects array with the sorted order
          subjects = sortedSubjects;
          
          // Filter the fullMarks and schedule objects based on the filtered and sorted subjects
          const filteredFullMarks = {};
          const filteredSchedule = {};

          subjects.forEach(subject => {
            // Check if this subject was converted from Arabic-Hindi to Arabic
            const originalSubject = subject === 'Arabic' ? 
              (Object.keys(fullMarks).find(s => s.toLowerCase().includes('arabic') && s.toLowerCase().includes('hindi')) || subject) :
              subject;
            
            // Map the original subject to the new subject name in fullMarks and schedule
            if (fullMarks[originalSubject]) {
              filteredFullMarks[subject] = fullMarks[originalSubject];
            } else if (fullMarks[subject]) {
              filteredFullMarks[subject] = fullMarks[subject];
            }
            
            if (schedule[originalSubject]) {
              filteredSchedule[subject] = schedule[originalSubject];
            } else if (schedule[subject]) {
              filteredSchedule[subject] = schedule[subject];
            }
          });

          // Use the already processed subjects

          // Create filtered exam config
          const filteredExamConfig = {
            ...(rawExamData || {}),
            subjects: subjects,
            fullMarks: filteredFullMarks,
            schedule: filteredSchedule,
            evaluationTypes: rawExamData?.evaluationTypes || examDetails?.evaluationTypes || ['Written']
          };

          // Create the processed student data with only the filtered exam config
          return {
            ...student,
            // Include filtered exam config at root level
            examConfig: {
              [examName]: filteredExamConfig
            }
          };
        });
      };

      const processed = processStudents();
      console.log('Processed students with exam configs:', processed);
      setProcessedStudents(processed);
    }
  }, [students, selectedExam, exams, rawExamConfig, selectedClass, examConfigs]);

  // Log when the component mounts
  useEffect(() => {
    console.log("AdmitCardPanel mounted");
    if (selectedClass) {
      console.log("Initial class selected:", selectedClass);
      fetchExams(selectedClass);
    }
  }, []);

  // Log state changes
  useEffect(() => {
    console.log("Exams available for rendering:", exams);
    console.log("Selected exam:", selectedExam);
  }, [exams, selectedExam]);

  const handlePrintPreview = (student) => {
    // Find the processed student data
    const processedStudent = processedStudents.find(s => s._id === student._id);
    if (processedStudent) {
      console.log("Showing print preview for student:", processedStudent);
      setPrintPreviewStudent(processedStudent);
      setShowPrintPreview(true);
    }
    console.log('Original subjects:', subjects);

    // Filter subjects based on student's religion if needed
    if (student.religion && subjects.length > 0) {
      const studentReligion = student.religion.trim().toUpperCase();
      console.log(`Filtering subjects for religion: ${studentReligion}`);
      
      const normalizedSubjects = subjects.map(s => ({
        original: s,
        lower: s.toLowerCase().trim()
      }));
      
      if (studentReligion === 'OTHER') {
        console.log('Applying OTHER religion filter');
        // For OTHER religion, include only Hindi but exclude Arabic-Hindi
        const filtered = normalizedSubjects.filter(({ lower, original }) => {
          const isHindi = lower.includes('hindi');
          const isArabicHindi = lower.includes('arabic-hindi') || 
                             (lower.includes('arabic') && lower.includes('hindi'));
          const include = isHindi && !isArabicHindi;
          
          console.log(`Subject: ${original}`, {
            isHindi,
            isArabicHindi,
            include
          });
          
          return include;
        });
        
        setSubjects(filtered.map(({ original }) => original));
        console.log('Filtered subjects for OTHER:', subjects);
          
      } else if (studentReligion === 'ISLAM') {
        console.log('Applying ISLAM religion filter');
        // For ISLAM religion, include Urdu and Arabic-Hindi
        const filtered = normalizedSubjects.filter(({ lower, original }) => {
          const matches = lower.includes('urdu') || 
                         lower.includes('arabic-hindi') ||
                         (lower.includes('arabic') && lower.includes('hindi'));
          
          console.log(`Subject: ${original}`, {
            matches,
            includesUrdu: lower.includes('urdu'),
            includesArabicHindi: lower.includes('arabic-hindi'),
            includesBoth: (lower.includes('arabic') && lower.includes('hindi'))
          });
          
          return matches;
        });
        
        setSubjects(filtered.map(({ original }) => original));
        console.log('Filtered subjects for ISLAM:', subjects);
      } else {
        console.log(`No specific filter for religion: ${studentReligion}`);
      }
    } else {
      console.log('No religion specified or no subjects to filter');
    }
    
    console.log('Final subjects after filtering:', subjects);
    console.groupEnd();


    // Filter the fullMarks and schedule objects based on the filtered subjects
    const filteredFullMarks = {};
    const filteredSchedule = {};
    const fullMarks = rawExamData?.fullMarks || examDetails?.fullMarks || {};
    const schedule = rawExamData?.schedule || examDetails?.schedule || {};

    subjects.forEach(subject => {
      if (fullMarks[subject]) {
        filteredFullMarks[subject] = fullMarks[subject];
      }
      if (schedule[subject]) {
        filteredSchedule[subject] = schedule[subject];
      }
    });

    // Combine student data with filtered exam data
    const studentWithExam = {
      ...student,
      exam: {
        ...selectedExamData,
        name: examName,
        subjects: subjects,
        evaluationTypes: rawExamData?.evaluationTypes || examDetails?.evaluationTypes || ['Written'],
        fullMarks: filteredFullMarks,
        schedule: filteredSchedule,
        // Include the full examConfig if available
        ...(rawExamData && { 
          examConfig: { 
            [examName]: {
              ...rawExamData,
              subjects: subjects,
              fullMarks: filteredFullMarks,
              schedule: filteredSchedule
            } 
          } 
        })
      },
      classInfo: {
        name: selectedClass,
        section: student.section || "",
        session: new Date().getFullYear(),
      },
    };

    console.log("Student with filtered exam data:", studentWithExam);
    setPrintPreviewStudent(studentWithExam);
  };

  const handleClosePrintPreview = () => {
    setPrintPreviewStudent(null);
  };
console.log("processedStudents in AdmitCardPanel:", processedStudents);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Print Preview Modal */}
      {printPreviewStudent && (
        <AdmitPrintPreviewModal
          isOpen={showPrintPreview}
          onClose={handleClosePrintPreview}
          student={printPreviewStudent}
          examConfig={selectedExamConfig}
          selectedExam={selectedExam}
          schoolInfo={schoolinfo}
          classInfo={{
            name: selectedClass,
            section: printPreviewStudent?.section || "",
            session: new Date().getFullYear(),
          }}
        />
      )}

      {/* Print All Preview Modal */}
      {showPrintAllPreview && (
        <AdmitPrintAllPreviewModal
          isOpen={showPrintAllPreview}
          onClose={handleClosePrintAllPreview}
          students={processedStudents}
          examConfig={selectedExamConfig || exams.find(exam => exam._id === selectedExam) || {}}
          className={selectedClass}
        />
      )}
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Admit Card Management
      </h1>

      {/* Class and Exam Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Select Class & Exam
        </h2>
        <div className="space-y-4">
          <ExamDependentClassSelectorCard
            onSelect={setSelectedClass}
            selectedClass={selectedClass}
            title="Select Class for Admit Cards"
            showConfigMessage={true}
          />

          {selectedClass && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                  Select Exam
                </h3>
                {selectedExam && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {exams.length} {exams.length === 1 ? "exam" : "exams"} found
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <button
                      key={exam._id}
                      onClick={() => setSelectedExam(exam._id)}
                      className={`py-1.5 px-4 rounded-full text-sm transition-all duration-200 border-2 flex-shrink-0 ${
                        selectedExam === exam._id
                          ? "border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 font-medium shadow-sm"
                          : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/80"
                      }`}
                    >
                      {exam.name}
                    </button>
                  ))
                ) : loading ? (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="col-span-full text-center py-8 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No exams
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {loading
                        ? "Loading exams..."
                        : "No exams found for this class"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Students List */}
      {selectedClass && selectedExam && (
        <div className="mt-8">
          {/* Exam Details Section */}
        

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Students - {selectedClass}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {students.length} {students.length === 1 ? "student" : "students"}{" "}
                found
              </div>
              <button
                onClick={handlePrintAll}
                className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-lg text-white ${
                  isOpeningModal ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform ${
                  isOpeningModal ? 'scale-100' : 'hover:scale-105'
                }`}
                disabled={!processedStudents.length || isOpeningModal}
              >
                {isOpeningModal ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-5 w-5" />
                    <span className="font-semibold">Preparing...</span>
                  </>
                ) : (
                  <>
                    <FiPrinter className="mr-2 h-5 w-5" />
                    <span className="font-semibold">Print All Admit Cards</span>
                  </>
                )}
              </button>
              
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {processedStudents.map((student) => {
                // Get the processed exam config for this student
                const examConfig = student.examConfig?.[Object.keys(student.examConfig || {})[0]] || {};
                const subjects = examConfig.subjects || [];
                const subjectCount = subjects.length;
                
                // Debug: Check if student has photoUrl
                console.log('Student data:', {
                  id: student._id,
                  name: student.studentName,
                  hasPhoto: !!student.photoUrl,
                  photoUrl: student.photoUrl
                });

                return (
                  <div
                    key={student._id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50"
                  >
                    {/* Student Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-3 relative rounded-t-2xl">
                      <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-white/10 rounded-full"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="flex-shrink-0 relative">
                          {student.photoUrl ? (
                            <img 
                              src={student.photoUrl} 
                              alt={student.studentName || 'Student'}
                              className="h-10 w-10 rounded-md object-cover border-2 border-white/30"
                              onError={(e) => {
                                // Hide the image and show the fallback if it fails to load
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-md border-2 border-white/30 flex items-center justify-center bg-white/20 text-white font-bold text-sm ${
                              student.photoUrl ? 'hidden' : 'flex'
                            }`}
                          >
                            {student.studentName
                              ? student.studentName.trim().charAt(0).toUpperCase()
                              : "N"}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {student.studentName?.trim() || "No Name"}
                          </h3>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-teal-100">
                              R: {student.roll?.trim() || "N/A"}
                            </span>
                            <span className="text-teal-200">•</span>
                            <span className="text-xs text-teal-100">
                              {selectedClass || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exam Info - Only show exam name */}
                    <div className="p-2 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-teal-100 dark:border-teal-800/30">
                      <h4 className="font-semibold text-center text-teal-800 dark:text-teal-200 text-sm">
                        {selectedExam
                          ?.split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </h4>
                    </div>

                    {/* Subjects */}
                    <div className="p-2.5">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Subjects
                        </h4>
                        <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full">
                          {subjectCount} {subjectCount === 1 ? 'Subject' : 'Subjects'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {subjects.length > 0 ? (
                          subjects.map((subject, index) => (
                            <div
                              key={subject}
                              className={`flex items-center px-2 py-1.5 rounded-md transition-colors ${
                                index % 2 === 0
                                  ? "bg-gray-50 dark:bg-gray-800/50"
                                  : "bg-white dark:bg-gray-800/30"
                              } hover:bg-teal-50 dark:hover:bg-teal-900/10`}
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-2 flex-shrink-0"></div>
                              <span
                                className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate"
                                title={subject}
                              >
                                {subject}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                            No subjects available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Print Button */}
                    <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 border-t border-teal-100 dark:border-teal-800/30">
                      <button
                        onClick={() => handlePrintPreview(student)}
                        className="w-full flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 shadow-sm transition-colors duration-150"
                      >
                        <FiPrinter className="mr-2 h-4 w-4" />
                        Print Admit Card
                      </button>
                    </div>
                  </div>
                );
              })}

              
            </div>
          ) : (
            <div className="col-span-full text-center py-12 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                <FiUser className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No students found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                {selectedClass
                  ? "No students are currently enrolled in this class for the selected exam."
                  : "Please select a class and exam to view students."}
              </p>
              {!selectedExam && selectedClass && (
                <div className="mt-4">
                  <button
                    onClick={() =>
                      document.getElementById("exam-selector")?.focus()
                    }
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FiAward className="mr-2 h-4 w-4" />
                    Select Exam
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdmitCardPanel;
