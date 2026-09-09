

const Button = ({ title, className, onClick, type = 'button', disabled = false }) => {
    return (
      <button
        type={type}
        className={className}
        onClick={onClick}
        disabled={disabled}
      >
        {title}
      </button>
    );
  };
  
  export default Button;