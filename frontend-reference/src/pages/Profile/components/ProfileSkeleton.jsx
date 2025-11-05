/**
 * ProfileSkeleton Component
 * Loading skeleton for profile page
 */
import React from "react";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button Skeleton */}
        <div className="h-10 w-32 bg-gray-200 rounded-full mb-4"></div>

        {/* Profile Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gray-300 -mt-16 border-4 border-white mb-4"></div>

            {/* Name & Headline */}
            <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 w-96 bg-gray-200 rounded mb-4"></div>

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-gray-100">
              <div>
                <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Posts Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
