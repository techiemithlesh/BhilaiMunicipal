import { Link, useNavigate } from "react-router-dom";

const ActionButton = ({
  label,
  onClick,
  to,
  show = true,
  disabled = false,
  icon,
  className = "",
  target,
}) => {
  const navigate = useNavigate();

  if (!show) return null;

  const handleClick = () => {
    if (to) navigate(to);
    else if (onClick) onClick();
  };

  return (
    <>
      {to && target ?(
        <Link to={to} target={target} className={`bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition duration-200 flex items-center gap-2 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}>
          {icon}
          {label}
        </Link>

      ):(
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition duration-200 flex items-center gap-2 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}
        >
          {icon && <span>{icon}</span>}
          {label}
        </button>

      )}
    </>
  );
};

export default ActionButton;
