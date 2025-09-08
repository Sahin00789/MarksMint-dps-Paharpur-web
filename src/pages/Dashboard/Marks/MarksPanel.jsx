import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { FiUpload, FiPrinter } from "react-icons/fi";
import ClassSelectorCard from "@/components/common/ClassSelectorCard";
import {
  getStudentsByClass,
  updateStudent,
  bulkUpdateMarks,
} from "@/services/students";
import { getClassConfig } from "@/services/classConfig";

import ExcelImportModalforMarks from "@/pages/Dashboard/Marks/Modals/ExcelImportModalforMarks.jsx";
import MarksUpdateModal from "./Modals/marksUpdateModal.jsx";

export default function MarksPanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exams, setExams] = useState([]);
  const [fullMarks, setFullMarks] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [marksForm, setMarksForm] = useState({});
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printPreviewRef = useRef(null);

  // Handle marks import
  const handleExcelImport = useCallback(
    async (importData) => {
      if (!selectedClass || !selectedExam) return;

      try {
        setSubmitting(true);
        setError(null);

        const formatedData = importData.rows.map((student) => {
          // pick subjects dynamically from headers except Roll & Student Name & class
          const subjects = {};
          importData.headers.forEach((header) => {
            if (
              header !== "Roll" &&
              header !== "Student Name" &&
              header !== "class"
            ) {
              subjects[header] = student[header]; // convert to number
            }
          });

          return {
            studentName: student["Student Name"],
            roll: student["Roll"],
            marks: {
              [selectedExam]: subjects,
            },
          };
        });
        // Transform the mapping into the format expected by the API
        console.log(formatedData);

        await bulkUpdateMarks(selectedClass, selectedExam, formatedData);

        // Refresh the student data
        const data = await getStudentsByClass(selectedClass);
        setStudents(Array.isArray(data) ? data : []);

        return true;
      } catch (error) {
        console.error("Error importing marks:", error);
        setError(error.message || "Failed to import marks");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [selectedClass, selectedExam]
  );

  // Load class from localStorage on initial render
  useEffect(() => {
    const savedClass = typeof window !== 'undefined' 
      ? window.localStorage.getItem('ui.selectedClass')
      : null;
    
    if (savedClass) {
      setSelectedClass(savedClass);
    }
  }, []);

  // Save class to localStorage when it changes
  useEffect(() => {
    if (selectedClass) {
      try {
        window.localStorage.setItem('ui.selectedClass', selectedClass);
      } catch (_) {}
    }
  }, [selectedClass]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass) return;
      setLoading(true);
      setError(null);
      try {
        console.log(
          "Fetching students for class:",
          selectedClass,
          "exam:",
          selectedExam
        );
        // Pass selectedExam to get ranks
        const data = await getStudentsByClass(selectedClass, selectedExam);
        console.log("Received students data:", data);

        const cfg = await getClassConfig(selectedClass);

        // Log the first student to check rank data
        if (data && data.length > 0) {
          console.log("First student data:", data[0]);
          console.log("Does first student have rank?", "rank" in data[0]);
        }

        // Data is already sorted by rank from the backend
        setStudents(Array.isArray(data) ? data : []);
        setExams(cfg.terms || []);
        setSubjects(cfg.subjects);

        // Set the first exam if none selected
        if (Array.isArray(cfg?.terms) && cfg.terms.length && !selectedExam) {
          setSelectedExam(cfg.terms[0]);
        }
        
        // Update fullMarks with the config
        if (cfg?.fullMarks) {
          setFullMarks(prev => ({
            ...prev,
            ...cfg.fullMarks,
            // Ensure current exam has a value
            [selectedExam]: cfg.fullMarks[selectedExam] ?? 100
          }));
        }
      } catch (e) {
        setError("Failed to load students/config");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedClass, selectedExam]);

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
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full">
            <ClassSelectorCard
              selected={selectedClass}
              onSelect={setSelectedClass}
            />
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 dark:text-white">
                Select Exam:
              </h3>
              <div className="flex flex-wrap gap-2">
                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <button
                      key={exam}
                      onClick={() => setSelectedExam(exam)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        selectedExam === exam
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {exam}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No exams configured. Configure in Configuration panel.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {!selectedClass ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Select a class to manage marks.
            </p>
          ) : loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loading students…
            </p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-2">
              {students.length > 0 ? (
                // Sort students by roll number before mapping
                [...students]
                  .sort((a, b) => {
                    // First sort by roll number
                    if (a.roll !== b.roll) return a.roll - b.roll;
                    // If roll numbers are the same, sort by name
                    return a.studentName.localeCompare(b.studentName);
                  })
                  .map((stu) => {
                    // Calculate total and percentage if marks exist
                    const marks = stu.marks?.[selectedExam] || {};
                    const maxMark = fullMarks?.[selectedExam] || 100;
                    const totalMarks = Object.values(marks).reduce(
                      (sum, mark) => sum + (Number(mark) || 0),
                      0
                    );
                    const totalPossibleMarks = subjects.length * maxMark;
                    const percentage =
                      totalPossibleMarks > 0
                        ? Math.round((totalMarks / totalPossibleMarks) * 100)
                        : 0;

                    return (
                      <div
                        key={stu._id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group cursor-pointer"
                        onClick={() => {
                          setEditingStudent(stu);
                          setMarksForm(marks);
                          setShowMarksModal(true);
                        }}
                      >
                        {/* Header with student info */}
                        <div className=" bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                          <div className="grid grid-cols-[2fr_0.5fr_1.5fr] w-full  justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg truncate">
                                {stu.studentName}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                  Roll: {stu.roll || "N/A"}
                                </span>
                                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                  {stu.class}
                                </span>
                              </div>
                            </div>
                            <div>
                              {stu.rank && (
                                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-base font-extrabold rounded-full h-8 w-8 flex items-center justify-center shadow-xl ring-2 ring-white dark:ring-white/80 z-10 transform hover:scale-125 transition-all duration-200">
                                  {stu.rank}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="relative">
                                <div className="text-2xl font-bold">
                                  {totalMarks}
                                  <span className="text-sm font-normal">
                                    /
                                    {subjects.length *
                                      (fullMarks?.[selectedExam] || 100)}
                                  </span>
                                </div>
                                <div className="text-xs opacity-80">
                                  {stu.rank
                                    ? `Rank ${stu.rank} of ${
                                        stu.totalStudents || "--"
                                      }`
                                    : "Total Marks"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subject Marks Grid */}
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-3">
                            {subjects.map((subj) => {
                              const mark = marks[subj];
                              const isAbsent = mark === "AB";
                              const numericMark = isAbsent
                                ? 0
                                : Number(mark) || 0;
                              const maxMark = fullMarks?.[selectedExam] || 100;
                              const percentage = isAbsent
                                ? 0
                                : Math.round((numericMark / maxMark) * 100);
                              const colorClass = isAbsent
                                ? "from-gray-400 to-gray-500"
                                : percentage >= 80
                                ? "from-green-500 to-emerald-600"
                                : percentage >= 40
                                ? "from-amber-400 to-amber-500"
                                : "from-red-400 to-red-500";

                              return (
                                <div
                                  key={subj}
                                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5 transition-all hover:shadow-sm"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                                      {subj}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                      {isAbsent
                                        ? "Absent"
                                        : numericMark || "--"}
                                      <span className="text-xs font-normal text-gray-500">
                                        /{maxMark}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                                      style={{
                                        width: `${Math.min(percentage, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="text-right mt-0.5">
                                    <span
                                      className={`text-xs font-medium ${
                                        isAbsent
                                          ? "text-gray-500"
                                          : percentage >= 80
                                          ? "text-green-600"
                                          : percentage >= 40
                                          ? "text-amber-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {isAbsent ? "Absent" : `${percentage}%`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer with percentage and edit button */}
                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-1 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Performance
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span
                                className={`text-sm font-semibold ${
                                  percentage >= 80
                                    ? "text-green-600 dark:text-green-400"
                                    : percentage >= 40
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStudent(stu);
                              setMarksForm(marks);
                              setShowMarksModal(true);
                            }}
                            className="mt-2 w-full py-1.5 px-3 text-sm font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Marks
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  No students found for {selectedClass}.
                </p>
              )}
            </div>
          )}
          {/* students card ends */}
        </div>
      </div>

      {/* Import Marks Modal */}
      {showExcelImportModal && (
        <ExcelImportModalforMarks
          isOpen={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
          selectedClass={selectedClass}
          selectedExam={selectedExam}
          title="Import Marks from Excel"
          selectedColumns={["Roll", "Student Name", ...subjects]}
          onImport={handleExcelImport}
        />
      )}

      {/* Update Marks Modal */}
      <MarksUpdateModal
        isOpen={showMarksModal}
        onClose={() => setShowMarksModal(false)}
        student={editingStudent}
        examName={selectedExam}
        subjects={subjects}
        initialMarks={marksForm}
        onSubmit={async (updatedMarks) => {
          if (!editingStudent || !selectedClass || !selectedExam) return;
          
          try {
            setSubmitting(true);
            
            // Prepare the data in the format expected by the API
            const updateData = {
              studentName: editingStudent.studentName,
              roll: editingStudent.roll,
              marks: {
                [selectedExam]: updatedMarks
              }
            };
            
            // Call the API to update marks
            await bulkUpdateMarks(selectedClass, selectedExam, [updateData]);
            
            // Refresh the student data
            const data = await getStudentsByClass(selectedClass, selectedExam);
            setStudents(Array.isArray(data) ? data : []);
            
            return true;
          } catch (error) {
            console.error('Error updating marks:', error);
            setError(error.message || 'Failed to update marks');
            return false;
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
