import api from './api';

// Placeholder endpoints. Adjust to your backend.
// Suggested endpoints:
// GET    /configs/:classId
// PUT    /config/classes/:classId
// Optionally, section-specific endpoints could exist too.

export async function getClassConfig(classId) {
  const params = { _ts: Date.now() };
  const { data } = await api.get(`/configs/${encodeURIComponent(classId)}`, { params });
  const cfg = data?.config || data || {};
  const normalizedExams = Array.isArray(cfg.exams) ? cfg.exams : (Array.isArray(cfg.terms) ? cfg.terms : []);
  const normalizedSubjects = Array.isArray(cfg.subjects) ? cfg.subjects : [];
  const normalizedFullMarks = cfg.fullMarks || cfg.examsFullMarks || {};
  const normalizedOpenDays = Number(cfg.openDays ?? cfg.workingDays ?? cfg.daysOpen) || 0;
  return { exams: normalizedExams, subjects: normalizedSubjects, fullMarks: normalizedFullMarks, openDays: normalizedOpenDays };
}

export async function saveClassConfig(classId, payload) {
  const p = payload || {};
  const exams = Array.isArray(p.exams) ? p.exams : (Array.isArray(p.terms) ? p.terms : []);
  const subjects = Array.isArray(p.subjects) ? p.subjects : [];
  const fullMarks = (p.fullMarks && typeof p.fullMarks === 'object') ? p.fullMarks : ((p.examsFullMarks && typeof p.examsFullMarks === 'object') ? p.examsFullMarks : {});
  const openDays = Number(p.openDays ?? p.workingDays ?? p.daysOpen) || 0;

  // Preferred normalized body
  const standard = { class: classId, exams, subjects, fullMarks, openDays };
  // Aliased keys backend expects (per posted controller): terms, subjects, fullMarks, openDays
  const aliased = { class: classId, terms: exams, subjects, fullMarks, openDays };

  const attempts = [
    // Backend expects POST /api/configs with terms/subjects/fullMarks/openDays
    { method: 'post', url: '/configs', body: aliased },
    // Fallbacks
    { method: 'post', url: '/configs', body: standard },
    { method: 'put', url: `/configs/${encodeURIComponent(classId)}`, body: standard },
    { method: 'put', url: `/config/classes/${encodeURIComponent(classId)}`, body: standard },
    { method: 'post', url: '/config/classes', body: standard },
    { method: 'put', url: `/config/classes/${encodeURIComponent(classId)}`, body: aliased },
  ];

  let lastErr;
  for (const a of attempts) {
    try {
      const { data } = await api[a.method](a.url, a.body);
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Failed to save class config');
}

// Attempt to fetch status for multiple classes in one shot.
// Expected response shape:
// { [classId]: { configured: boolean, examsCount: number, subjectsCount: number, openDays: number, fullMarksCount: number } }
export async function getClassesConfigStatus(classIds = []) {
  // 1) Preferred: GET all configs and derive
  try {
    const { data: listData } = await api.get('/configs', { params: { _ts: Date.now() } });
    console.log(listData);
    
    const items = Array.isArray(listData?.items) ? listData.items : (Array.isArray(listData) ? listData : []);
    if (Array.isArray(items)) {
      const map = Object.fromEntries(
        classIds.map((cls) => {
          const doc = items.find((it) => (it?.class || it?.cls || it?.name) === cls) || {};
          const termsArr = Array.isArray(doc.terms) ? doc.terms : (Array.isArray(doc.exams) ? doc.exams : []);
          const subjectsArr = Array.isArray(doc.subjects) ? doc.subjects : [];
          const fmObj = (doc && typeof doc.fullMarks === 'object' && doc.fullMarks)
            || (doc && typeof doc.examsFullMarks === 'object' && doc.examsFullMarks)
            || {};
          const openDaysVal = Number(doc.openDays ?? doc.workingDays ?? doc.daysOpen) || 0;
          const examsCount = termsArr.length;
          const subjectsCount = subjectsArr.length;
          const fullMarksCount = fmObj && typeof fmObj === 'object' ? Object.keys(fmObj).length : 0;
          const configured = examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDaysVal > 0;
          return [cls, { configured, examsCount, subjectsCount, fullMarksCount, subjectsArr,fmObj,openDays },subjectsArr,fmObj];
        })
      );
      return map;
    }
  } catch (_) {}

  // 2) POST /config/classes/status fallback
  try {
    const body = { classes: classIds, _ts: Date.now() };
    const { data } = await api.post('/config/classes/status', body);
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      const looksLikeMap = keys.some(k => classIds.includes(k));
      if (looksLikeMap) {
        const derived = Object.fromEntries(
          classIds.map((cls) => {
            const v = data[cls] || {};
            const examsArr = Array.isArray(v.exams) ? v.exams : (Array.isArray(v.terms) ? v.terms : []);
            const subjectsArr = Array.isArray(v.subjects) ? v.subjects : [];
            const fmObj = (v && typeof v.fullMarks === 'object' && v.fullMarks)
              || (v && typeof v.examsFullMarks === 'object' && v.examsFullMarks)
              || {};
            const openDaysVal = Number(v.openDays ?? v.workingDays ?? v.daysOpen) || 0;
            const examsCount = typeof v.examsCount === 'number' ? v.examsCount : (Array.isArray(examsArr) ? examsArr.length : 0);
            const subjectsCount = typeof v.subjectsCount === 'number' ? v.subjectsCount : (Array.isArray(subjectsArr) ? subjectsArr.length : 0);
            const fullMarksCount = typeof v.fullMarksCount === 'number' ? v.fullMarksCount : (fmObj && typeof fmObj === 'object' ? Object.keys(fmObj).length : 0);
            const openDays = typeof v.openDays === 'number' ? v.openDays : openDaysVal;
            const configured = typeof v.configured === 'boolean' ? v.configured : (examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDays > 0);
            return [cls, { configured, examsCount, subjectsCount, fullMarksCount, openDays }];
          })
        );
        return derived;
      }

      if (data.classes) {
        if (!Array.isArray(data.classes) && typeof data.classes === 'object') {
          return data.classes;
        }
        if (Array.isArray(data.classes)) {
          const arr = data.classes;
          if (arr.length > 0 && typeof arr[0] === 'string') {
            const entries = await Promise.all(
              arr.map(async (cls) => {
                try {
                  const cfg = await getClassConfig(cls);
                  const examsCount = Array.isArray(cfg?.exams) ? cfg.exams.length : 0;
                  const subjectsCount = Array.isArray(cfg?.subjects) ? cfg.subjects.length : 0;
                  const fullMarksCount = cfg?.fullMarks && typeof cfg.fullMarks === 'object' ? Object.keys(cfg.fullMarks).length : 0;
                  const openDays = Number(cfg?.openDays) || 0;
                  const configured = examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDays > 0;
                  return [cls, { configured, examsCount, subjectsCount, fullMarksCount, openDays }];
                } catch (e) {
                  return [cls, { configured: false, examsCount: 0, subjectsCount: 0, fullMarksCount: 0, openDays: 0 }];
                }
              })
            );
            return Object.fromEntries(entries);
          }
          if (arr.length > 0 && typeof arr[0] === 'object') {
            return Object.fromEntries(
              arr
                .filter(it => it && (it.class || it.classId))
                .map(it => {
                  const cls = it.class || it.classId;
                  return [cls, {
                    configured: !!it.configured,
                    examsCount: Number(it.examsCount ?? (Array.isArray(it.exams) ? it.exams.length : (Array.isArray(it.terms) ? it.terms.length : 0))) || 0,
                    subjectsCount: Number(it.subjectsCount ?? (Array.isArray(it.subjects) ? it.subjects.length : 0)) || 0,
                    fullMarksCount: Number(it.fullMarksCount ?? (it.fullMarks && typeof it.fullMarks === 'object' ? Object.keys(it.fullMarks).length : 0)) || 0,
                    openDays: Number(it.openDays) || 0,
                  }];
                })
            );
          }
          return {};
        }
      }

      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === 'string') {
          const entries = await Promise.all(
            data.map(async (cls) => {
              try {
                const cfg = await getClassConfig(cls);
                const examsCount = Array.isArray(cfg?.exams) ? cfg.exams.length : 0;
                const subjectsCount = Array.isArray(cfg?.subjects) ? cfg.subjects.length : 0;
                const fullMarksCount = cfg?.fullMarks && typeof cfg.fullMarks === 'object' ? Object.keys(cfg.fullMarks).length : 0;
                const openDays = Number(cfg?.openDays) || 0;
                const configured = examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDays > 0;
                return [cls, { configured, examsCount, subjectsCount, fullMarksCount, openDays }];
              } catch (e) {
                return [cls, { configured: false, examsCount: 0, subjectsCount: 0, fullMarksCount: 0, openDays: 0 }];
              }
            })
          );
          return Object.fromEntries(entries);
        }
        return Object.fromEntries(
          data
            .filter(it => it && (it.class || it.classId))
            .map(it => {
              const cls = it.class || it.classId;
              return [cls, {
                configured: !!it.configured,
                examsCount: Number(it.examsCount ?? (Array.isArray(it.exams) ? it.exams.length : (Array.isArray(it.terms) ? it.terms.length : 0))) || 0,
                subjectsCount: Number(it.subjectsCount ?? (Array.isArray(it.subjects) ? it.subjects.length : 0)) || 0,
                fullMarksCount: Number(it.fullMarksCount ?? (it.fullMarks && typeof it.fullMarks === 'object' ? Object.keys(it.fullMarks).length : 0)) || 0,
                openDays: Number(it.openDays) || 0,
              }];
            })
        );
      }
    }
  } catch (_) {}

  // 3) GET /config/classes/status fallback
  try {
    const params = { classes: classIds.join(','), _ts: Date.now() };
    const { data } = await api.get('/config/classes/status', { params });
    if (data && typeof data === 'object') {
      if (typeof data.classes === 'string') {
        const list = data.classes.split(',').map(s => s.trim()).filter(Boolean);
        const entries = await Promise.all(
          list.map(async (cls) => {
            try {
              const cfg = await getClassConfig(cls);
              const examsCount = Array.isArray(cfg?.exams) ? cfg.exams.length : 0;
              const subjectsCount = Array.isArray(cfg?.subjects) ? cfg.subjects.length : 0;
              const fullMarksCount = cfg?.fullMarks && typeof cfg.fullMarks === 'object' ? Object.keys(cfg.fullMarks).length : 0;
              const openDays = Number(cfg?.openDays) || 0;
              const configured = examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDays > 0;
              return [cls, { configured, examsCount, subjectsCount, fullMarksCount, openDays }];
            } catch (e) {
              return [cls, { configured: false, examsCount: 0, subjectsCount: 0, fullMarksCount: 0, openDays: 0 }];
            }
          })
        );
        return Object.fromEntries(entries);
      }
      if (data.classes && typeof data.classes === 'object') return data.classes;

      const keys = Object.keys(data);
      const looksLikeMap = keys.some(k => classIds.includes(k));
      if (looksLikeMap) {
        const derived = Object.fromEntries(
          classIds.map((cls) => {
            const v = data[cls] || {};
            const examsArr = Array.isArray(v.exams) ? v.exams : (Array.isArray(v.terms) ? v.terms : []);
            const subjectsArr = Array.isArray(v.subjects) ? v.subjects : [];
            const fmObj = (v && typeof v.fullMarks === 'object' && v.fullMarks)
              || (v && typeof v.examsFullMarks === 'object' && v.examsFullMarks)
              || {};
            const openDaysVal = Number(v.openDays ?? v.workingDays ?? v.daysOpen) || 0;
            const examsCount = typeof v.examsCount === 'number' ? v.examsCount : (Array.isArray(examsArr) ? examsArr.length : 0);
            const subjectsCount = typeof v.subjectsCount === 'number' ? v.subjectsCount : (Array.isArray(subjectsArr) ? subjectsArr.length : 0);
            const fullMarksCount = typeof v.fullMarksCount === 'number' ? v.fullMarksCount : (fmObj && typeof fmObj === 'object' ? Object.keys(fmObj).length : 0);
            const openDays = typeof v.openDays === 'number' ? v.openDays : openDaysVal;
            const configured = typeof v.configured === 'boolean' ? v.configured : (examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDays > 0);
            return [cls, { configured, examsCount, subjectsCount, fullMarksCount, openDays }];
          })
        );
        return derived;
      }

      return data;
    }
  } catch (_) {}

  // 4) Last resort: fetch each class
  const entries = await Promise.all(
    classIds.map(async (cls) => {
      try {
        const cfg = await getClassConfig(cls);
        const examsCount = Array.isArray(cfg?.exams) ? cfg.exams.length : 0;
        const subjectsCount = Array.isArray(cfg?.subjects) ? cfg.subjects.length : 0;
        const fullMarksCount = cfg?.fullMarks && typeof cfg.fullMarks === 'object' ? Object.keys(cfg.fullMarks).length : 0;
        const openDays = Number(cfg?.openDays) || 0;
        const configured = examsCount > 0 || subjectsCount > 0 || fullMarksCount > 0 || openDays > 0;
        return [cls, { configured, examsCount, subjectsCount, fullMarksCount, openDays }];
      } catch (e) {
        return [cls, { configured: false, examsCount: 0, subjectsCount: 0, fullMarksCount: 0, openDays: 0 }];
      }
    })
  );
  return Object.fromEntries(entries);
}
