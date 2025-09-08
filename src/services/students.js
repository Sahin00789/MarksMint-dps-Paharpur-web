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
      if (student.marks && typeof student.marks === 'object') {
        // Ensure marks is always an object
        student.marks = student.marks ;
      } else {
        student.marks = {};
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

// Upload multiple photos at once. Backend should accept array field 'files'.
export async function uploadStudentPhotosBatch(files = [], params = {}) {
  const form = new FormData();
  (files || []).forEach((f) => {
    if (f) form.append('files', f);
  });
  Object.entries(params || {}).forEach(([k, v]) => form.append(k, v));
  const res = await api.post('/students/photos/batch', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

/**
 * Update marks for multiple students in a class for a specific exam
 * @param {string} classId - The class ID
 * @param {string} exam - The exam name/ID
 * @param {Array} marksData - Array of { roll, studentName, marks: { [subject]: mark } } objects
 * @returns {Promise<Object>} The API response
 */
export async function bulkUpdateMarks(classId, exam, marksData) {
  try {
    // Transform the data to match server expectations
    const formattedData = marksData.map(student => {
      const marks = {};
      
      // Process each subject mark
      if (student.marks && student.marks[exam]) {
        Object.entries(student.marks[exam]).forEach(([subject, mark]) => {
          // Convert empty strings to null and ensure 'AB' is uppercase
          if (mark === '') {
            marks[subject] = null;
          } else if (typeof mark === 'string' && mark.toUpperCase() === 'AB') {
            marks[subject] = 'AB';
          } else if (!isNaN(mark) && mark !== '') {
            // Convert numeric strings to numbers
            marks[subject] = Number(mark);
          } else {
            marks[subject] = mark;
          }
        });
      }

      return {
        roll: student.roll,
        studentName: student.studentName,
        marks: {
          [exam]: marks
        }
      };
    });

    const res = await api.post(`/students/bulkupdatemarks`, {
      cls: classId,
      exam,
      marksdata: formattedData
    });
    
    return res.data;
  } catch (error) {
    console.error('Error in bulkUpdateMarks:', error);
    // Log the exact data that caused the error for debugging
    
    throw error;
  }
}
