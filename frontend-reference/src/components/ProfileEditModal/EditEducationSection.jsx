/**
 * EditEducationSection Component
 * 
 * Manages education entries with add/edit/delete functionality
 * Similar structure to EditExperienceSection but for education
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditEducationSection({ education, setFormData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formState, setFormState] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    grade: "",
    activities: "",
    description: "",
  });

  const handleAdd = () => {
    setFormState({
      school: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      grade: "",
      activities: "",
      description: "",
    });
    setIsAdding(true);
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    const edu = education[index];
    setFormState({
      ...edu,
      startDate: edu.startDate ? new Date(edu.startDate).toISOString().split("T")[0] : "",
      endDate: edu.endDate ? new Date(edu.endDate).toISOString().split("T")[0] : "",
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formState.school || !formState.degree) {
      alert("School and degree are required");
      return;
    }

    const newEdu = {
      ...formState,
      startDate: formState.startDate ? new Date(formState.startDate) : null,
      endDate: formState.endDate ? new Date(formState.endDate) : null,
    };

    if (editingIndex !== null) {
      // Update existing
      const updated = [...education];
      updated[editingIndex] = newEdu;
      setFormData((prev) => ({
        ...prev,
        education: updated,
      }));
    } else {
      // Add new
      setFormData((prev) => ({
        ...prev,
        education: [...(prev.education || []), newEdu],
      }));
    }

    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this education?")) {
      setFormData((prev) => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Education
        </h3>
        <button
          onClick={handleAdd}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Education
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(isAdding || editingIndex !== null) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School *
                  </label>
                  <input
                    type="text"
                    value={formState.school}
                    onChange={(e) => setFormState({ ...formState, school: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Stanford University"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree *
                  </label>
                  <input
                    type="text"
                    value={formState.degree}
                    onChange={(e) => setFormState({ ...formState, degree: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bachelor of Science"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={formState.fieldOfStudy}
                  onChange={(e) => setFormState({ ...formState, fieldOfStudy: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (or expected)
                  </label>
                  <input
                    type="date"
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  value={formState.grade}
                  onChange={(e) => setFormState({ ...formState, grade: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 3.8 GPA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activities and societies
                </label>
                <input
                  type="text"
                  value={formState.activities}
                  onChange={(e) => setFormState({ ...formState, activities: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Computer Science Club, Dean's List"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  placeholder="Additional information about your studies..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingIndex !== null ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education List */}
      <div className="space-y-3">
        <AnimatePresence>
          {education && education.length > 0 ? (
            education.map((edu, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {edu.school}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {edu.degree}{edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      {edu.grade && ` • ${edu.grade}`}
                    </p>
                    {edu.activities && (
                      <p className="text-sm text-gray-600 mt-2">
                        {edu.activities}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {edu.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-700 p-2"
                      aria-label="Edit education"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                      aria-label="Delete education"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            !isAdding && (
              <p className="text-gray-500 text-sm italic text-center py-4">
                No education added yet
              </p>
            )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
