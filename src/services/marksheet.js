// Import statements removed as they're no longer needed

export async function getMarksheet(student, className) {
  try {
    console.log(`[Marksheet] Processing marksheet for student ${student?._id} in class ${className}`);
    
    if (!student) {
      throw new Error('Student data not provided');
    }

    // Use the student's marks directly
    const marks = student.marks || {};
    console.log('[Marksheet] Student marks:', marks);
    
    // Get exam terms from the student's marks
    const examTerms = Object.keys(marks);
    console.log('[Marksheet] Exam terms from student data:', examTerms);
    
    if (examTerms.length === 0) {
      console.warn('[Marksheet] No exam terms found in student data');
    }
    
    // Create a simplified exam config based on available data
    const examConfig = {
      examConfig: {}
    };
    
    // Populate exam config with subjects from student's marks
    examTerms.forEach(term => {
      if (marks[term]) {
        examConfig.examConfig[term] = {
          subjects: Object.keys(marks[term] || {})
        };
      }
    });
    
    console.log('[Marksheet] Generated exam config:', examConfig);
    
    // No need to fetch attendance config for now
    const attendanceConfig = null;

    // Process results
    console.log('Processing student marks:', marks);
    
    console.log('Processing exam terms:', examTerms);
    
    examTerms.forEach(examTerm => {
      const examMarks = marks[examTerm];
      if (!examMarks) {
        console.warn(`No marks found for exam term: ${examTerm}`);
        return;
      }
      
      console.log(`Processing exam term: ${examTerm}`, examMarks);
      
      const result = {
        examName: examTerm,
        className: className,
        studentId: student._id,
        studentName: student.name || student.studentName,
        rollNumber: student.roll || student.rollNumber,
        subjects: {}
      };
      
      // Process each subject's marks
      Object.entries(examMarks).forEach(([subjectName, subjectMarks]) => {
        let marksData = {};
        let totalMarks = 0;
        let fullMarks = 100; // Default max marks per subject

        if (subjectMarks && typeof subjectMarks === 'object') {
          // Calculate total marks from all components
          totalMarks = Object.entries(subjectMarks).reduce((sum, [key, value]) => {
            // Skip SubjectTotal if present, we'll calculate it ourselves
            if (key === 'SubjectTotal') return sum;
            if (key === 'maxMarks') {
              fullMarks = parseFloat(value) || 100;
              return sum;
            }
            const markValue = parseFloat(value) || 0;
            return sum + markValue;
          }, 0);
          
          // Create the subject result
          marksData = {
            ...subjectMarks,
            subjectName: subjectName,
            obtainedMarks: totalMarks,
            maxMarks: fullMarks,
            percentage: fullMarks > 0 ? Math.round((totalMarks / fullMarks) * 100) : 0,
            grade: subjectMarks.grade || calculateGrade(totalMarks, fullMarks)
          };
        } else if (typeof subjectMarks === 'number' || !isNaN(parseFloat(subjectMarks))) {
          // Handle case where marks is just a number
          totalMarks = typeof subjectMarks === 'number' ? subjectMarks : parseFloat(subjectMarks);
          marksData = {
            subjectName: subjectName,
            obtainedMarks: totalMarks,
            maxMarks: fullMarks,
            percentage: Math.round((totalMarks / fullMarks) * 100),
            grade: calculateGrade(totalMarks, fullMarks)
          };
        }
        
        // Add the subject result to the exam result
        if (Object.keys(marksData).length > 0) {
          result.subjects[subjectName] = marksData;
        }
      });
      
      results.push(result);
    });

    const responseData = {
      success: true,
      data: {
        student,
        examConfig,
        attendanceConfig,
        results
      }
    };

    console.log('[Marksheet] Processed marksheet data:', responseData);
    return responseData;
  } catch (error) {
    console.error('[Marksheet] Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch marksheet data'
    };
  }
}

function calculateGrade(obtained, max) {
  if (!obtained || !max) return 'N/A';
  const percentage = (obtained / max) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}
