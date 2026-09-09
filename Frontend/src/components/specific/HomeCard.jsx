const HomeCard = ({
  title,
  imageUrl,
  icon: Icon,
  description,
  buttons,
  className,
}) => {
  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden bg-white hover:shadow-xl transition-all duration-300 ${className}`}
    >
      <div className="flex flex-col items-center p-5 space-y-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-28 h-28 object-cover rounded-full shadow-sm"
          />
        ) : Icon ? (
          <Icon className="text-5xl text-primary" />
        ) : null}
        {title && (
          <h2 className="text-xl md:text-2xl font-bold text-center">{title}</h2>
        )}
        {description && (
          <p className="text-gray-600 text-center">{description}</p>
        )}

        {buttons && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {buttons.map((button, index) => (
              <a
                key={index}
                href={button.link}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition hover:opacity-90 ${
                  button.className || "bg-primary text-white"
                }`}
              >
                {button.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCard;
