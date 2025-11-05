/**
 * EditSkillsSection Component
 * 
 * Allows adding, editing, and removing skills
 * LinkedIn-style pill badges with remove buttons
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditSkillsSection({ skills, setFormData }) {
  const [newSkill, setNewSkill] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;

    const skillObj = {
      name: newSkill.trim(),
      endorsements: 0,
      endorsedBy: [],
    };

    setFormData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), skillObj],
    }));

    setNewSkill("");
    setIsAdding(false);
  };

  const handleRemoveSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Skills
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Skill
        </button>
      </div>

      {/* Add Skill Input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., JavaScript, Project Management"
                className="flex-1 p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewSkill("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skills List */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills && skills.length > 0 ? (
            skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium group"
              >
                <span>{skill.name}</span>
                {skill.endorsements > 0 && (
                  <span className="text-xs text-blue-600">
                    {skill.endorsements}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveSkill(index)}
                  className="text-blue-600 hover:text-red-600 transition-colors ml-1"
                  aria-label={`Remove ${skill.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">
              No skills added yet. Click &quot;Add Skill&quot; to get started.
            </p>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Add skills to help others understand your expertise
      </p>
    </section>
  );
}
