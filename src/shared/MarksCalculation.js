/**
 * Process exam results for all students in a class.
 * @param {string} examName
 * @param {string} className
 * @param {Array} students
 * @param {Function} fetchClassConfig
 * @returns {Array} processed exam results [{ studentId, roll, subjectWise, total }]
 */
export async function getClassExamResults(examName, className, students, fetchClassConfig) {
    const classStudents = students.filter(s => s.class === className);
    const classConfig = await fetchClassConfig(className);
    const { examsFullMarks, subjects } = classConfig;
  
    const results = classStudents.map(student => {
      let obtainedTotal = 0;
      let fullTotal = 0;
      let subjectWise = {};
  
      for (let subject of subjects) {
        const obtained = student.exams[examName]?.[subject] ?? 0;
        const full = examsFullMarks[examName]?.[subject] ?? 0;
  
        obtainedTotal += obtained;
        fullTotal += full;
        subjectWise[subject] = {
          obtained,
          full,
          percent: full ? (obtained / full) * 100 : 0,
          grade: full ? getGrade((obtained / full) * 100) : "-"
        };
      }
  
      const percent = fullTotal ? (obtainedTotal / fullTotal) * 100 : 0;
  
      return {
        studentId: student.id,
        roll: student.roll,
        class: student.class,
        exam: examName,
        subjectWise,
        total: {
          obtained: obtainedTotal,
          full: fullTotal,
          percent,
          grade: getGrade(percent)
          // rank will be added below
        }
      };
    });
  
    // Rank students within class by percentage
    results.sort((a, b) => b.total.percent - a.total.percent);
    results.forEach((r, idx) => {
      r.total.rank = `${idx + 1}/${results.length}`;
    });
  
    return results;
  };

  /**
 * Generate full marksheet data for a class (all students, all exams).
 * @param {string} className
 * @param {Array} students
 * @param {Function} fetchClassConfig
 * @returns {Array} marksheets [{ studentId, roll, class, subjectWise, overall }]
 */
export async function getClassMarksheetData(className, students, fetchClassConfig) {
    const classStudents = students.filter(s => s.class === className);
    const classConfig = await fetchClassConfig(className);
    const { examsFullMarks, subjects } = classConfig;
  
    const results = classStudents.map(student => {
      let subjectWise = {};
      let overallTotal = 0;
      let overallFull = 0;
  
      for (let examName in student.exams) {
        for (let subject of subjects) {
          const obtained = student.exams[examName]?.[subject] ?? 0;
          const full = examsFullMarks[examName]?.[subject] ?? 0;
  
          subjectWise[subject] = subjectWise[subject] || { obtained: 0, full: 0 };
          subjectWise[subject].obtained += obtained;
          subjectWise[subject].full += full;
  
          overallTotal += obtained;
          overallFull += full;
        }
      }
  
      // Calculate subject percentages + grades
      for (let subject in subjectWise) {
        const { obtained, full } = subjectWise[subject];
        subjectWise[subject].percent = full ? (obtained / full) * 100 : 0;
        subjectWise[subject].grade = full ? getGrade(subjectWise[subject].percent) : "-";
      }
  
      const overallPercent = overallFull ? (overallTotal / overallFull) * 100 : 0;
  
      return {
        studentId: student.id,
        roll: student.roll,
        class: student.class,
        subjectWise,
        overall: {
          obtained: overallTotal,
          full: overallFull,
          percent: overallPercent,
          grade: getGrade(overallPercent)
          // rank will be added below
        }
      };
    });
  
    // Rank overall in class
    results.sort((a, b) => b.overall.percent - a.overall.percent);
    results.forEach((r, idx) => {
      r.overall.rank = `${idx + 1}/${results.length}`;
    });
  
    return results;
  }