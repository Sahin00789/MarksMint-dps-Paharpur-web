/**
 * School Information Configuration
 * Contains all the details about the school that are used throughout the application
 */

export const schoolinfo = {
  // School Basic Information
  name: 'Dina Public School',
  branch: 'Paharpur',
  address: 'Paharpur, Banshihari, Dakshin Dinajpur, 733125',
  regNumber: '06608/IV',
  runBy: 'M.M.D.C.T.',
  estd: '2022',
  curriculamFollows: 'WBBSE & WBBPE',
  
  // Contact Information
  contact: {
    phone: '+91 6295884463',
    email: 'dinapublicschool.paharpur@gmail.com',
    website: 'https://dpspaharpur.web.app/'
  },
};

// Available classes in the school
export const classesInTheSchool = [
  'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'
];

// Examination terms in the school
export const examTermsInTheSchool = [
  'First Summative Evaluation',
  'Second Summative Evaluation',
  'Third Summative Evaluation'
];

// Subjects taught in the school
export const subjectsInTheSchool = [
  'Bengali', 'English', 'Math', 'G_K', 'Evs', 'Science','Geography', 'History','Computer','Hindi','Arabic-Hindi'
];

// Export all as default object
export default {
  schoolinfo,
  classesInTheSchool,
  examTermsInTheSchool,
  subjectsInTheSchool
};
