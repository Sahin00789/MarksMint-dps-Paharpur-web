import api from './api';

// Adjust endpoints to match your backend. These are placeholders.
export async function getStudentsByClass(cls, exam = null, params = {}) {
  // Add cache-busting param to avoid 304 with empty body in some browsers
  const requestParams = { 
    class: cls, 
    exam, // Include exam in params for rank calculation
    _ts: Date.now(), 
    ...params 
  };
  console.debug('[students] GET /students params ->', requestParams);
  const res = await api.get('/students', { params: requestParams });
  const data = res?.data;
  
  // The backend now returns the array directly
  if (Array.isArray(data)) {
    console.debug('[students] response status', res.status, 'count', data.length);
    return data;
  }
  
  // Fallback to previous response formats for backward compatibility
  let list = [];
  if (Array.isArray(data?.students)) list = data.students;
  else if (Array.isArray(data?.data)) list = data.data;
  else if (Array.isArray(data?.results)) list = data.results;
  
  console.debug('[students] response status', res.status, 'count', list.length);
  return list;
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
  // Otherwise send JSON array
  const res = await api.post('/students/bulkupdatestudents', { students: fileOrArray, ...extra });
   console.log("formbyapi",fileOrArray);
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
 * @param {Array} marksData - Array of { studentId, subjectCode, marks } objects
 * @returns {Promise<Object>} The API response
 */
export async function bulkUpdateMarks(classId, exam, marksData) {
  try {
    const res = await api.post(`/students/bulkupdatemarks`, {
      cls: classId,
      exam,
      marksdata: marksData
    });
    return res.data;
  } catch (error) {
    console.error('Error in bulkUpdateMarks:', error);
    throw error;
  }
}
