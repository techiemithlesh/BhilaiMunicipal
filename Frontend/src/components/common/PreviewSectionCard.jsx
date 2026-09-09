const PreviewSectionCard = ({ title, children }) => {
  return (
    <div className="bg-white shadow rounded-xl p-5 border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">{title}</h2>
      {children}
    </div>
  );
};

export default PreviewSectionCard;
