
export default function FormSection({ title, children }) {
  return (
    <div className="border rounded-md mb-6 overflow-hidden shadow-sm">
      <h2 className="bg-blue-600 text-white px-3 py-2 font-semibold">
        {title}
      </h2>
      <div className="bg-blue-50 p-4">{children}</div>
    </div>
  );
}
