export default function FormCardPreview({ title, formFields }) {
  return (
    <div className="flex flex-col gap-2 w-full text-gray-700 text-lg">
      {title && (
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase leading-4 tracking-wide">
          {title}
        </h2>
      )}
      <div className="gap-2 grid grid-cols-2 bg-white p-2 border-2 rounded-md">
        {formFields.map((field, index) => (
          <div
            key={field.name || index}
            className={`col-span-${field.colSpan}`}
          >
            <span className="font-semibold">{field.label}:</span>{" "}
            <span>
              {field.value !== undefined && field.value !== ""
                ? Array.isArray(field.value)
                  ? field.value.map((ele, i) => (
                      <span key={i} className="block">
                        {i + 1}. {ele.tradeItem || String(ele)}
                      </span>
                    ))
                  : field.value
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
