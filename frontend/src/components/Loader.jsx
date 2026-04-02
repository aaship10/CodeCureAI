import React from 'react';

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-zinc-400 text-sm tracking-widest uppercase animate-pulse">
        Processing Data...
      </p>
    </div>
  );
}