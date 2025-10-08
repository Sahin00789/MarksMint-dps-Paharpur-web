import api from './api';

// Adjust endpoints to match your backend. These are placeholders.
export async function getStudentsByClass(cls, exam = null, params = {}) {
  try {
    const requestParams = { 
      class: cls, 
      exam,
      _ts: Date.now(),
      ...params 
    };
    
    console.debug('[students] GET /students params ->', requestParams);
    const res = await api.get('/students', { params: requestParams });
    let data = res?.data;
    
    // Ensure we have an array of students
    let students = [];
    if (Array.isArray(data)) {
      students = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.students)) students = data.students;
      else if (Array.isArray(data.data)) students = data.data;
      else if (Array.isArray(data.results)) students = data.results;
    }
    
    // Process each student's marks to ensure consistent format
    students = students.map(student => {
      // Ensure marks is always an object
      if (!student.marks || typeof student.marks !== 'object') {
        student.marks = {};
      }
      
      // Ensure the exam exists in marks
      if (exam && !student.marks[exam]) {
        student.marks[exam] = {};
      }
      
      // Process each subject's marks to ensure they're objects
      if (student.marks[exam]) {
        Object.keys(student.marks[exam]).forEach(subject => {
          // If the mark is a string or number, convert it to { written: value } format
          if (student.marks[exam][subject] !== null && 
              typeof student.marks[exam][subject] === 'object' && 
              !Array.isArray(student.marks[exam][subject])) {
            // Already in the correct format
            return;
          }
          
          // Convert legacy format to new format
          const markValue = student.marks[exam][subject];
          if (markValue !== undefined && markValue !== null) {
            student.marks[exam][subject] = { written: String(markValue) };
          }
        });
      }
      
      return student;
    });
    
    console.debug('[students] Processed', students.length, 'students');
    return students;
    
  } catch (error) {
    console.error('Error in getStudentsByClass:', error);
    throw error;
  }
}

export async function getStudentById(id) {
  const res = await api.get(`/students/${id}`);
  return res.data;
}

export async function updateStudent(id, payload) {
  const res = await api.put(`/students/${id}`, payload);
  return res.data;
}

export async function createStudent(payload) {
  // Support FormData for photo upload
  if (payload instanceof FormData) {
    const res = await api.post('/students', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  const res = await api.post('/students', payload);
  return res.data;
}

export async function deleteStudent(id) {
  const res = await api.delete(`/students/${id}`);
  return res.data;
}

// Bulk create students from CSV or JSON array
export async function bulkCreateStudents(fileOrArray, extra = {}) {
  // If a File is provided, send as multipart/form-data
  if (fileOrArray instanceof File) {
    const form = new FormData();
    form.append('file', fileOrArray);
    Object.entries(extra || {}).forEach(([k, v]) => form.append(k, v));
    const res = await api.post('/students/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }

  console.log( extra);
  
  // Otherwise send JSON array
  const res = await api.post('/students/bulkupdatestudents', { students: fileOrArray });
  
  return res.data;
}

// Upload multiple student photos mapped by admission or roll inside a zip
export async function uploadStudentPhotos(file, params = {}) {
  const form = new FormData();
  form.append('file', file);
  Object.entries(params || {}).forEach(([k, v]) => form.append(k, v));
  const res = await api.post('/students/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

// Upload multiple photos at once. Backend expects array field 'photos'.
// progressCallback receives { total, loaded, percent } for upload progress
export async function uploadStudentPhotosBatch(files = [], params = {}, progressCallback) {
  try {
    if (!files || !files.length) {
      throw new Error('No files provided for upload');
    }
    
    const form = new FormData();
    
    // Add class and section as form fields
    if (!params.class) {
      throw new Error('Class is required for photo upload');
    }
    form.append('className', params.class);
    
    if (params.section) {
      form.append('section', params.section);
    }
    
    // Convert FileList to array if needed
    const filesArray = Array.isArray(files) ? files : Array.from(files);
    
    // Add files to form data
    filesArray.forEach((file, index) => {
      if (file) {
        // Handle both direct files and file objects with metadata
        const fileObj = file.file ? file : { file };
        const fileToUpload = fileObj.file || file;
        
        // Add roll number if available
        if (fileObj.roll) {
          form.append('rollNumbers', fileObj.roll);
        }
        
        // Append the file with a unique name
        form.append('photos', fileToUpload, fileToUpload.name || `photo-${Date.now()}-${index}.jpg`);
      }
    });
    
    // Debug: Log form data
    console.log('Uploading form data:', {
      fileCount: filesArray.length,
      class: params.class,
      section: params.section || 'not provided'
    });
    
    // Make the API request
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': localStorage.getItem('token') || ''
      },
      onUploadProgress: progressCallback ? (progressEvent) => {
        const { loaded, total } = progressEvent;
        const percent = Math.round((loaded * 100) / (total || 1));
        progressCallback({ 
          loaded, 
          total: total || 1, 
          percent: Math.min(percent, 100)
        });
      } : undefined
    };
    
    const res = await api.post('/student-photos', form, config);
    
    // Log detailed results
    if (res.data.failed && res.data.failed.length > 0) {
      console.error('Some files failed to upload:', {
        total: res.data.summary?.total || 0,
        successful: res.data.summary?.successful || 0,
        failed: res.data.summary?.failed || 0,
        errors: res.data.failed.map(f => ({
          file: f.filename || 'Unknown file',
          error: f.error || 'Unknown error',
          details: f.details || 'No details available'
        }))
      });
    } else {
      console.log('Upload successful:', res.data);
    }
    
    return res.data;
  } catch (error) {
    const errorDetails = {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      request: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    };
    
    console.error('Error in uploadStudentPhotosBatch:', errorDetails);
    
    // Log the full error object for debugging
    console.error('Full error object:', error);
    
    // Rethrow with more context
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Failed to upload photos';
    const apiError = new Error(errorMessage);
    apiError.response = error.response;
    apiError.details = errorDetails;
    throw apiError;
  }
}

// Map frontend field names to backend field names
const CO_SCHOLASTIC_FIELD_MAP = {
  'workEducation': 'workEd',
  'artEducation': 'artEd',
  'healthAndPhysical': 'phyEd',
  'discipline': 'discipline'
};

/**
 * Update co-scholastic grades for multiple students in a class
 * @param {string} className - The class name
 * @param {Array} grades - Array of { studentId, rollNumber, grades: { [category]: grade } } objects
 * @returns {Promise<Object>} The API response
 */
export async function bulkUpdateCoScholastic(className, grades) {
  try {
    // Transform the grades to match the backend schema
    const transformedGrades = grades.map(studentGrade => ({
      studentId: studentGrade.studentId,
      rollNumber: studentGrade.rollNumber,
      grades: {
        // Map the grades directly since we're already using the correct field names
        workEd: studentGrade.grades?.workEd || '-',
        artEd: studentGrade.grades?.artEd || '-',
        phyEd: studentGrade.grades?.phyEd || '-',
        discipline: studentGrade.grades?.discipline || '-'
      }
    }));

    const response = await api.post('/students/bulk-update/coscholastic', {
      class: className,
      grades: transformedGrades
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating co-scholastic grades:', error);
    
    // Add more detailed error information
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}

/**
 * Fetches co-scholastic grades for all students in a class
 * @param {string} className - The class name to fetch grades for
 * @returns {Promise<Array>} Array of student objects with co-scholastic grades
 */
export async function getCoScholasticGrades(className) {
  try {
    console.debug(`[students] Fetching co-scholastic grades for class ${className}`);
    const response = await api.get('/co-scholastic/grades', {
      params: { 
        class: className,
        _ts: Date.now() // Prevent caching
      }
    });
    
    // Handle different response formats
    let data = response?.data;
    if (data && !Array.isArray(data)) {
      data = data.data || data.grades || data.results || [];
    }
    
    if (!Array.isArray(data)) {
      console.warn('Unexpected response format for co-scholastic grades:', data);
      return [];
    }
    
    console.debug(`[students] Retrieved ${data.length} co-scholastic grade records`);
    return data.map(grade => ({
      studentId: grade.studentId || grade._id || grade.id,
      rollNumber: grade.rollNumber,
      studentName: grade.studentName,
      ...grade.grades // Spread the grades object to include all co-scholastic fields
    }));
    
  } catch (error) {
    console.error('Error fetching co-scholastic grades:', error);
    throw error;
  }
}

/**
 * Bulk update marks for multiple students
 * @param {string} classId - The class ID
 * @param {string} exam - The exam name
 * @param {Array} marksData - Array of student objects with marks
 * @returns {Promise<Object>} The API response
 */
export async function bulkUpdateMarks(classId, exam, marksData) {
  try {
    if (!classId || !exam || !Array.isArray(marksData)) {
      throw new Error('Invalid parameters for bulkUpdateMarks');
    }

    console.log('Preparing bulk update marks request...');
    console.log('Class ID:', classId);
    console.log('Exam:', exam);
    console.log('Marks data sample:', marksData.length > 0 ? marksData[0] : 'No data');

    // Prepare the request data according to the server's expected format
    const requestData = {
      cls: classId,
      exam: exam,
      marksdata: marksData.map(student => {
        // Create a clean student object with only the necessary fields
        const { roll, studentName, ...marks } = student;
        
        // Ensure we have required fields
        if (!roll) {
          console.warn('Missing roll number in student data:', student);
        }
        
        // Create the student object with marks directly in the root
        const studentData = {
          roll: String(roll), // Ensure roll is a string
          studentName: studentName || ''
        };

        // Process each mark and add it to the student data
        Object.entries(marks).forEach(([subject, value]) => {
          // Skip non-subject fields
          if (['_id', 'class', 'id', 'marks'].includes(subject)) return;
          
          // If the value is an object (e.g., { written: 20 }), use it as is
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            studentData[subject] = value;
          } else {
            // If the value is not an object, create a new object with the exam as the key
            studentData[subject] = { [exam]: value };
          }
        });

        return studentData;
      })
    };

    console.log('Sending bulk update request to /students/bulkupdatemarks');
    console.log('Request data structure:', {
      cls: typeof requestData.cls,
      exam: typeof requestData.exam,
      marksdata: Array.isArray(requestData.marksdata) ? 
        `${requestData.marksdata.length} items` : 'Invalid format',
      sampleMark: requestData.marksdata[0] ? 
        JSON.stringify(requestData.marksdata[0]) : 'No sample data'
    });
    
    const response = await api.post('/students/bulkupdatemarks', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('Received response from server:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Received response data' : 'No data in response'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in bulkUpdateMarks:', error);
    if (error.response) {
      console.error('Server responded with:', error.response.data);
      const errorMessage = error.response.data?.message || 'Failed to update marks';
      const errorDetails = error.response.data?.errors || [];
      throw new Error(`${errorMessage}${errorDetails.length ? ': ' + errorDetails.join(', ') : ''}`);
    }
    throw new Error(error.message || 'Failed to connect to server');
  }
}
