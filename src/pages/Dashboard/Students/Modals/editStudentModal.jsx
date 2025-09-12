import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const EditStudentModal = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    roll: '',
    class: '',
    fatherName: '',
    mobileNumber: '',
    address: '',
    dob: '', // Changed from dateOfBirth to match backend
    photo: null,
    photoPreview: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (student) {
      const formatDate = (dateValue) => {
        if (!dateValue) return '';
        
        try {
          let date;
          
          if (typeof dateValue === 'string') {
            if (dateValue.includes('/')) {
              const [month, day, year] = dateValue.split('/').map(Number);
              if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                date = new Date(year, month - 1, day);
              }
            }
            
            if (!date || isNaN(date.getTime())) {
              date = parseISO(dateValue);
            }
            
            if (isNaN(date.getTime()) && dateValue.includes('-')) {
              const [day, month, year] = dateValue.split('-').map(Number);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                date = new Date(year, month - 1, day);
              }
            }
          } else if (dateValue instanceof Date) {
            date = dateValue;
          } else if (dateValue?.$date) {
            date = new Date(dateValue.$date);
          } else {
            date = new Date(dateValue);
          }
          
          return date && !isNaN(date.getTime()) ? format(date, 'yyyy-MM-dd') : '';
        } catch (e) {
          console.error('Error parsing date:', dateValue, e);
          return '';
        }
      };
      
      setFormData({
        studentName: student.studentName || '',
        roll: student.roll || '',
        class: student.class || '',
        fatherName: student.fatherName || '',
        mobileNumber: student.mobileNumber || student.contactNumber || '',
        address: student.address || '',
        dob: formatDate(student.dob),
        photo: null,
        photoPreview: student.photoUrl || student.photo || ''
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'photo' && files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: files[0],
          photoPreview: reader.result
        }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.studentName || !formData.roll) {
      toast.error('Student name and roll number are required');
      return;
    }
    
    // Validate mobile number if provided
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    const { photoPreview, ...formDataToSubmit } = formData;
    onSave(e, formDataToSubmit);
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 500 }
    },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
              onClick={onClose}
              variants={backdropVariants}
              aria-hidden="true"
            />
            <motion.div 
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Edit Student
                      </h3>
                      <p className="mt-1 text-sm text-purple-100">
                        Update student information
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={onClose}
                      className="text-purple-100 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Photo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Student Photo
                </label>
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {formData.photoPreview || formData.photo ? (
                      <img
                        src={formData.photoPreview || URL.createObjectURL(formData.photo)}
                        alt="Student preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-full w-full text-gray-300 dark:text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.936 0 9.29 2.54 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-4 bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {formData.photoPreview || formData.photo ? 'Change' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Roll Number *
                </label>
                <input
                  type="number"
                  name="roll"
                  value={formData.roll}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Class *
                </label>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  readOnly
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Father's Name *
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber || formData.contactNumber || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ''}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address *
                </label>
                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                ></textarea>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditStudentModal;
