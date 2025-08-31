import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { classesIntheSchhol } from "../../shared/schoolInformation";
import ClassConfigModalV2 from "../Modals/ClassConfig/ClassConfigModalV2";
import {
  getClassConfig,
  saveClassConfig,
  getClassesConfigStatus,
} from "../../services/config";
import ModalPortal from "../common/ModalPortal";

export default function ConfigurationPanel() {
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

  const metric = (label, value, color = "text-gray-700 dark:text-gray-100") => (
    <span
      className={`flex w-full items-center justify-center gap-x-10 text-lg px-2 py-0.5 rounded-md bg-white/70 dark:bg-gray-700/50 ${color} ring-1 ring-gray-200 dark:ring-gray-600`}
    >
      <div>{label} :</div> {value}
    </span>
  );

  const skeletonCard = (i) => (
    <div
      key={`s-${i}`}
      className="rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 bg-white/60 dark:bg-gray-800/60 p-4 animate-pulse space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="flex justify-end">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="w-full ">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuration
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure exams, subjects, full marks, and school open days per class.
        </p>
      </div>

      {statusError && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
          Failed to load statuses: {String(statusError)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4  overflow-y-auto">
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
                  className={`${cardClasses} rounded-xl ring-1 p-4 space-y-3 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 ">
                      <div className="flex justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {cls}
                        </h3>{" "}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md h-fit ${badgeClasses}`}
                        >
                          {configured ? "Configured" : "Not Configured"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full items-center justify-center">
                        {metric(
                          "Exams",
                          typeof s.examsCount === "number" ? s.examsCount : 0
                        )}
                        {metric(
                          "Subjects",
                          typeof s.subjectsCount === "number"
                            ? s.subjectsCount
                            : 0
                        )}
                        {metric(
                          "Classes Taken (days)",
                          typeof s.openDays === "number" ? s.openDays : 0
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      className="inline-flex w-full items-center justify-center px-3 py-2 text-lg rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => openConfig(cls, "exams")}
                      aria-label={`Configure ${cls}`}
                    >
                      {configured ? "Edit" : "Configure"}
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      {(selectedClass && activeConfig) || modalClosing ? (
        <ModalPortal>
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
        </ModalPortal>
      ) : null}
    </div>
  );
}
