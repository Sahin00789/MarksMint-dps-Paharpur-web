import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { classesIntheSchhol } from "@/shared/schoolInformation";
import ClassConfigModalV2 from "@/pages/Dashboard/Configuaration/Modals/ClassConfigModalV2";
import { getClassConfig, getClassesConfigStatus } from "@/services/classConfig";

function ConfigurationPanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeConfig, setActiveConfig] = useState(null); // 'exams' | 'subjects' | 'fullMarks' | 'openDays'
  const [initialData, setInitialData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);

  const loadStatuses = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const m = await getClassesConfigStatus(classesIntheSchhol);
      setStatusMap(m || {});
    } catch (e) {
      console.error("Failed to load config statuses", e);
      setStatusMap({});
      setStatusError(e?.message || "Failed to load");
      toast.error(`Failed to load configuration statuses: ${e?.message || ""}`);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const closeModal = () => {
    // Animate out before unmounting
    setModalClosing(true);
    setTimeout(() => {
      setSelectedClass(null);
      setActiveConfig(null);
      setModalClosing(false);
    }, 200);
  };

  const openConfig = async (cls, type) => {
    setSelectedClass(cls);
    setActiveConfig(type);
    setModalLoading(true);
    try {
      const data = await getClassConfig(cls);
      setInitialData(data || {});
    } catch (e) {
      console.error("Failed to load class config", e);
      setInitialData({});
    } finally {
      setModalLoading(false);
    }
  };

  const handleSave = async (payload) => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      await saveClassConfig(selectedClass, payload);
      closeModal();
      await loadStatuses();
      toast.success("Configuration saved");
    } catch (e) {
      console.error("Failed to save class config", e);
      toast.error(`Save failed: ${e?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  const MetricItem = ({ icon, label, value, color = "text-gray-700 dark:text-gray-200" }) => (
    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className={`p-1.5 rounded-full ${color.replace('text-', 'bg-').split(' ')[0]}/10`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );

  const skeletonCard = (i) => (
    <div
      key={`s-${i}`}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 p-5 animate-pulse space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
        <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
        <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
      </div>
      <div className="pt-2">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Configuration</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage exams, subjects, and academic settings for each class
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadStatuses}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              <span className="text-gray-600 dark:text-gray-300">Configured</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
              <span className="text-gray-600 dark:text-gray-300">Needs Setup</span>
            </div>
          </div>
        </div>
      </div>

      {statusError && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
          Failed to load statuses: {String(statusError)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 py-2">
        {statusLoading
          ? Array.from({ length: classesIntheSchhol.length }).map((_, i) =>
              skeletonCard(i)
            )
          : classesIntheSchhol.map((cls) => {
              const s = statusMap[cls] || {};
              const configured = !!s.configured;

              const cardClasses =
                "bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700";
              const badgeClasses = configured
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 ring-1 ring-gray-300 dark:ring-gray-600";

              return (
                <div
                  key={cls}
                  className={`${cardClasses} rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 w-full`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {cls}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full h-fit ${
                        configured 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}
                    >
                      {configured ? '✓ Configured' : 'Needs Setup'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Exams & Full Marks</span>
                      </h4>
                      <div className="space-y-2">
                        {s.exams && s.exams.length > 0 ? (
                          s.exams.map((exam, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-md">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{exam}</p>
                              </div>
                              <div className="ml-2 flex-shrink-0">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  {s.fullMarks?.[exam] || 'N/A'} marks
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 p-2">No exams configured</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Subjects</span>
                      </h4>
                      {s.subjects && s.subjects.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {s.subjects.map((subject) => (
                            <span key={subject} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 truncate text-center">
                              {subject}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No subjects added</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => openConfig(cls, "exams")}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                      aria-label={`Configure ${cls}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {configured ? 'Edit Configuration' : 'Setup Configuration'}
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      {((selectedClass && activeConfig) || modalClosing) && (
        <div>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className={`absolute inset-0 bg-transparent backdrop-blur-sm transition-opacity duration-200 ${
                modalClosing ? "opacity-0" : "opacity-100"
              }`}
              onClick={closeModal}
            />
            <div
              className={`relative z-10 w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 p-4 md:p-6 transform transition-all duration-200 ease-out ${
                modalClosing
                  ? "opacity-0 scale-95 translate-y-2"
                  : "opacity-100 scale-100 translate-y-0"
              }`}
            >
              <div className="max-h-[70vh] overflow-y-auto">
                {modalLoading ? (
                  <div className="py-10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <ClassConfigModalV2
                    selectedClass={selectedClass}
                    section={activeConfig}
                    initialData={initialData}
                    onSave={handleSave}
                    onClose={closeModal}
                  />
                )}
              </div>
              {saving && (
                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigurationPanel;
