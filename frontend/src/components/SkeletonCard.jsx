import React from 'react';

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shimmer-wrapper">
    <div className="bg-slate-200 dark:bg-slate-800 h-48 rounded-xl w-full"></div>
    <div className="space-y-2">
      <div className="bg-slate-200 dark:bg-slate-800 h-3 rounded w-1/3"></div>
      <div className="bg-slate-200 dark:bg-slate-800 h-4 rounded w-2/3"></div>
    </div>
    <div className="flex justify-between items-center pt-2">
      <div className="bg-slate-200 dark:bg-slate-800 h-6 rounded w-1/4"></div>
      <div className="bg-slate-200 dark:bg-slate-800 h-8 rounded w-1/3"></div>
    </div>
  </div>
);

export default SkeletonCard;
