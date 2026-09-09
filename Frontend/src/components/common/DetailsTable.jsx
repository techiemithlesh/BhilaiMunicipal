const DetailsTable = ({ title, columns, data, renderers = {} }) => {
  return (
    <div className="bg-white border border-[#003366] rounded-md overflow-hidden font-sans">
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-t-md font-bold text-white text-lg uppercase tracking-wide">
        {title}
      </div>
      {/* <div className="bg-2 p-2 px-4 font-bold text-white text-lg">{title}</div> */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead className="bg-gray-200 text-left">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-1 border-white border-r font-semibold text-center text-sm"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-t">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-1 border text-center">
                      {renderers[col]
                        ? renderers[col](row[col], row, idx) // ✅ FIXED
                        : row[col] || "N/A"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-3 text-center">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetailsTable;
