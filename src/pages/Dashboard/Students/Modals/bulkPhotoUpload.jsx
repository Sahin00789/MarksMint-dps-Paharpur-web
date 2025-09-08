import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkPhotoUpload({ isOpen, onClose, onUpload }) {
  const [photosPreview, setPhotosPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotosFilesChange = useCallback((e) => {
    const files = Array.from(e.target.files);

    const newPhotos = files.map((file) => {
      const url = URL.createObjectURL(file);
      // Extract roll number from filename (assumes format: roll.jpg or roll_number.jpg)
      const rollMatch = file.name.match(/^(\d+)/);
      const roll = rollMatch ? rollMatch[1] : null;

      return {
        file,
        url,
        roll,
        matched: null, // Will be set when matching with students
      };
    });

    setPhotosPreview(newPhotos);
  }, []);

  const handlePhotosUpload = async (e) => {
    e.preventDefault();
    if (photosPreview.length === 0 || !onUpload) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Create FormData to send files
      const formData = new FormData();
      photosPreview.forEach((photo) => {
        formData.append("photos", photo.file);
      });

      await onUpload(formData);

      // Clean up object URLs
      photosPreview.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
      });

      // Reset form
      setPhotosPreview([]);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to upload photos. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimized animation variants
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
        staggerChildren: 0.05
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            initial="hidden"
            animate="visible"
            exit="exit"
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
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="space-y-1">
                    <motion.h2 
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                      variants={itemVariants}
                      custom={0}
                    >
                      Upload Student Photos
                    </motion.h2>
                    <motion.p 
                      className="text-sm text-gray-500 dark:text-gray-400"
                      variants={itemVariants}
                      custom={0.1}
                    >
                      Quickly upload multiple student profile pictures at once
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
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                </div>

                <form onSubmit={handlePhotosUpload} className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Photos
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {photosPreview.length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer group">
                        <div className="flex flex-col items-center justify-center w-full px-4 py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800/50 transition-all duration-200 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-blue-100 dark:group-hover:ring-blue-900/50">
                          <div className="p-3 mb-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                            <span className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            JPG, PNG (max 5MB each)
                          </p>
                          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            Tip: Name files with roll numbers (e.g., 101.jpg)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handlePhotosFilesChange}
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                      {error}
                    </div>
                  )}

                  {photosPreview.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {photosPreview.length} {photosPreview.length === 1 ? 'Photo' : 'Photos'} Ready to Upload
                        </h4>
                        <button
                          type="button"
                          onClick={() => setPhotosPreview([])}
                          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="max-h-64 overflow-auto p-2 bg-gray-50 dark:bg-gray-800/30">
                          <div className="grid grid-cols-1 gap-2">
                            {photosPreview.map((photo, index) => (
                              <div
                                key={index}
                                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800/70 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                              >
                                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                                  <img
                                    src={photo.url}
                                    alt={photo.file.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {photo.file.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      photo.roll 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                      {photo.roll ? `Roll: ${photo.roll}` : 'No roll number'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {(photo.file.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newPhotos = [...photosPreview];
                                    newPhotos.splice(index, 1);
                                    setPhotosPreview(newPhotos);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                  aria-label="Remove photo"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {photosPreview.length > 0 ? (
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          {photosPreview.length} {photosPreview.length === 1 ? 'photo' : 'photos'} ready
                        </span>
                      ) : (
                        <span>No photos selected</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={isSubmitting || photosPreview.length === 0}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            {photosPreview.length > 0 ? `Upload ${photosPreview.length} ${photosPreview.length === 1 ? 'Photo' : 'Photos'}` : 'Upload'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
