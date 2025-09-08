import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  FiUpload,
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { AnimatePresence, motion, usePresenceData, wrap } from "framer-motion";

const ExcelImportModal = ({
  isOpen,
  onClose,
  selectedColumns,
  onImport,
  selectedClass,
  title,
}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [file, setFile] = useState(null);

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

        const headers = jsonData[0];

        const rows = jsonData
          .slice(1)
          .filter((row) =>
            row.some((cell) => cell !== undefined && cell !== "")
          );

        // Filter data based on selected columns
        const columnIndices = selectedColumns.map((col) =>
          headers.findIndex(
            (h) => h && col && h.toString().toLowerCase() === col.toLowerCase()
          )
        );
        const filteredData = rows.map((row) => {
          const obj = {};
          columnIndices.forEach((colIndex, i) => {
            if (colIndex >= 0 && colIndex < row.length) {
              obj[selectedColumns[i]] = row[colIndex];
              obj["class"] = selectedClass;
            } else {
              obj[selectedColumns[i]] = "";
            }
          });
          return obj;
        });

        setPreviewData({
          headers: selectedColumns,
          rows: filteredData,
        });
        setData(filteredData);
      } catch (error) {
        console.error("Error processing file:", error);
        setError("Invalid file format. Please upload a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!previewData) {
      setError("No data to import");
      return;
    }

    if (!selectedClass) {
      setError("Please select a class first");
      return;
    }

    try {
      setIsLoading(true);
      await onImport({ ...previewData, class: selectedClass });
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      setError(error.message || "Failed to import data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData(null);
    setError("");
  };

  // Optimized animation variants for better performance
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.1,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      y: 10
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
        when: 'beforeChildren',
        staggerChildren: 0.03
      }
    },
    exit: {
      opacity: 0,
      y: 10,
      transition: { 
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  if (!isMounted) return null;

  if (isOpen)
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
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <motion.h3
                    className="text-xl font-semibold text-gray-900 dark:text-white"
                    variants={itemVariants}
                    custom={0}
                  >
                    Import Students from Excel
                  </motion.h3>
                  <motion.p
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    variants={itemVariants}
                    custom={0.1}
                  >
                    Upload an Excel file with student data
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
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FiFileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title} - {selectedClass}
                  </h2>
                </div>
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
              </div>

              <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800/50">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      <FiUpload className="mr-2 h-4 w-4" />
                      {file ? "Change File" : "Browse Files"}
                    </button>
                    {file && (
                      <button
                        type="button"
                        variant="ghost"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FiX className="mr-2 h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  {file && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {previewData?.rows?.length || 0} records found
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-2 p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 flex items-start space-x-2">
                  <FiAlertCircle className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {previewData && (
                <div className="mt-4 overflow-hidden border rounded-lg shadow-sm dark:border-gray-700 transition-all duration-300 hover:shadow-md flex-1 flex flex-col">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Preview ({previewData.rows.length} rows)
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <FiCheck className="mr-1 h-3 w-3" />
                        {previewData.rows.length} rows ready
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
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
                            {previewData.headers.map((header, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                              >
                                {row[header] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!previewData || isLoading}
                className={
                  ("px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  (!previewData || isLoading) &&
                    "opacity-70 cursor-not-allowed",
                  "transition-colors duration-150 ease-in-out")
                }
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  "Import Students"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
};

export default ExcelImportModal;
