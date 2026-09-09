import { forwardRef, useCallback, useState } from "react";

const CircularProgressAvatar = forwardRef(
  ({ progress = 0, imageUrl, fallbackText = "User", hoverText }, ref) => {
    const getGradientId = (progress) => {
      if (progress >= 80) return "greenGradient";
      if (progress >= 50) return "yellowGradient";
      return "redGradient";
    };

    const gradientId = getGradientId(progress);

    // Reference radius to a 100x100 viewBox for scaling
    const radius = 32;
    const stroke = 4;
    const normalizedRadius = radius - stroke;
    const circumference = 2 * Math.PI * normalizedRadius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
      if (!imageError) setImageError(true);
    }, [imageError]);

    return (
      <div className="relative w-full h-full" ref={ref} title={hoverText}>
        <svg
          className="top-0 left-0 absolute w-full h-full"
          viewBox="0 0 68 68"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient
              id="greenGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient
              id="yellowGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient
              id="redGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <circle
            cx="34"
            cy="34"
            r={normalizedRadius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          <circle
            cx="34"
            cy="34"
            r={normalizedRadius}
            fill="transparent"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 34 34)"
          />
        </svg>

        <div className="absolute inset-[11.75%] shadow rounded-full overflow-hidden">
          {!imageError ? (
            <img
              src={imageUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="flex justify-center items-center bg-gray-700 w-full h-full font-semibold text-white text-xs">
              {fallbackText}
            </div>
          )}
        </div>
      </div>
    );
  }
);

CircularProgressAvatar.displayName = "CircularProgressAvatar";

export default CircularProgressAvatar;
