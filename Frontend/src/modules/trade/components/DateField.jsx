import React from "react";

export default function DateField({ label, name, value, onChange, required }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        name={name}
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
        className="border px-3 py-2 rounded-md text-sm bg-white"
      />
    </div>
  );
}
