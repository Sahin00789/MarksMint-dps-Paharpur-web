import React, { useState, useCallback } from "react";
import ModalPortal from "../../common/ModalPortal";

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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Student Photos
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close"
              >
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
              </button>
            </div>

            <form onSubmit={handlePhotosUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Photos
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Multiple images (JPG, PNG, etc.)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {photosPreview.length}{" "}
                    {photosPreview.length === 1 ? "Photo" : "Photos"} to Upload
                  </h4>
                  <div className="max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                    {photosPreview.map((photo, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md"
                      >
                        <img
                          src={photo.url}
                          alt={photo.file.name}
                          className="h-12 w-12 flex-shrink-0 object-cover rounded-md ring-1 ring-gray-200 dark:ring-gray-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {photo.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {photo.roll
                              ? `Roll: ${photo.roll}`
                              : "No roll number detected"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isSubmitting || photosPreview.length === 0}
                >
                  {isSubmitting
                    ? "Uploading..."
                    : `Upload ${
                        photosPreview.length > 0
                          ? `(${photosPreview.length})`
                          : ""
                      }`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
