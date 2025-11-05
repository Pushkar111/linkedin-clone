/**
 * EditExperienceSection Component
 * 
 * Manages work experience entries with add/edit/delete functionality
 * LinkedIn-style forms with date pickers and validation
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditExperienceSection({ experiences, setFormData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formState, setFormState] = useState({
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    skills: [],
  });

  const handleAdd = () => {
    setFormState({
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      skills: [],
    });
    setIsAdding(true);
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    const exp = experiences[index];
    setFormState({
      ...exp,
      startDate: exp.startDate ? new Date(exp.startDate).toISOString().split("T")[0] : "",
      endDate: exp.endDate ? new Date(exp.endDate).toISOString().split("T")[0] : "",
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formState.company || !formState.position) {
      alert("Company and position are required");
      return;
    }

    const newExp = {
      ...formState,
      startDate: formState.startDate ? new Date(formState.startDate) : null,
      endDate: formState.current ? null : (formState.endDate ? new Date(formState.endDate) : null),
    };

    if (editingIndex !== null) {
      // Update existing
      const updated = [...experiences];
      updated[editingIndex] = newExp;
      setFormData((prev) => ({
        ...prev,
        experience: updated,
      }));
    } else {
      // Add new
      setFormData((prev) => ({
        ...prev,
        experience: [...(prev.experience || []), newExp],
      }));
    }

    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this experience?")) {
      setFormData((prev) => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index),
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
          Experience
        </h3>
        <button
          onClick={handleAdd}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Experience
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
                    Position *
                  </label>
                  <input
                    type="text"
                    value={formState.position}
                    onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formState.company}
                    onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Google"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Francisco, CA"
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
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    disabled={formState.current}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="current"
                  checked={formState.current}
                  onChange={(e) => setFormState({ ...formState, current: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="current" className="ml-2 text-sm text-gray-700">
                  I currently work here
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  placeholder="Describe your responsibilities and achievements..."
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

      {/* Experience List */}
      <div className="space-y-3">
        <AnimatePresence>
          {experiences && experiences.length > 0 ? (
            experiences.map((exp, index) => (
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
                      {exp.position}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {exp.company}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                      {exp.location && ` • ${exp.location}`}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-700 p-2"
                      aria-label="Edit experience"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                      aria-label="Delete experience"
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
                No experience added yet
              </p>
            )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
