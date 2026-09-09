// ColorWaveLoader.jsx
import React from "react";

const ColorWaveLoader = ({ bars = 7, height = 28, gap = 6 }) => {
  const items = Array.from({ length: bars });
  return (
    <div className="flex items-end" style={{ gap }}>
      {items.map((_, i) => (
        <span
          key={i}
          className="color-wave-bar"
          style={{ animationDelay: `${i * 120}ms`, height }}
        />
      ))}
    </div>
  );
};

export default ColorWaveLoader;
