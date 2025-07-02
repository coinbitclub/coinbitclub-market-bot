import { useState } from "react";

export function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-success text-white px-6 py-3 rounded-xl shadow-lg z-50">
      {message}
    </div>
  );
}
