const PreviewField = (label, value) => {
  return (
    <div className="flex flex-col mb-3">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <span className="text-gray-800 text-sm font-semibold">
        {value || "-"}
      </span>
    </div>
  );
};

export default PreviewField;
