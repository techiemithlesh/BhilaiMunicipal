const SectionCard = ({
  color,
  note,
  title,
  data = [],
  headers = [],
  renderRow,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow border border-blue-800 rounded-lg">
        {title &&(
          <div className="bg-blue-900 px-4 py-2 rounded-t-md font-bold text-white">
            {title}
          </div>

        )}
        <div className="p-4 text-gray-500 text-sm text-center">
          No {title} Available!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      {title &&(
        <div
          style={{ backgroundColor: color || "#1e3a8a" }} // fallback to Tailwind's bg-blue-900
          className={`px-4 py-2 rounded-t-md font-bold text-white`}
        >
          {title}
        </div>

      )}
      <div className="p-2 overflow-x-auto">
        {note && (
          <div
            className="bg-blue-50 mb-4 p-3 border-blue-500 border-l-4 rounded text-gray-700 text-sm"
            dangerouslySetInnerHTML={{ __html: note }}
          />
        )}
        <table className="border border-gray-300 w-full text-sm border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 border font-semibold text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{data.map((row, idx) => renderRow(row, idx))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default SectionCard;
