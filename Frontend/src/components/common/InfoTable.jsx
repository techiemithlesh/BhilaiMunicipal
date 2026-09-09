const InfoTable = ({ headers = [], rows = [], onUploadClick }) => {
  return (
    <div className="rounded-xl overflow-x-auto text-gray-800 text-sm">
      <table className="border border-gray-300 min-w-full text-left">
        <thead className="bg-gray-200 font-semibold uppercase">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2 border border-r-white last:border-r-0"
              >
                {header.label}
                {header.required && <span className="text-red-500"> *</span>}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rIndex) => (
            <tr key={rIndex} className="even:bg-gray-50">
              {headers.map((header, cIndex) => {
                const value = row[header.key];

                if (header.key === "upload") {
                  return (
                    <td
                      key={cIndex}
                      className="px-4 py-2 border last:border-r-0 font-medium"
                    >
                      <button
                        onClick={() => onUploadClick?.(row, rIndex)}
                        className="hover:bg-blue-50 px-2 py-1 border border-blue-500 rounded text-blue-700 text-xs"
                      >
                        Upload Document
                      </button>
                    </td>
                  );
                }

                if (header.key === "status") {
                  return (
                    <td
                      key={cIndex}
                      className="px-4 py-2 border last:border-r-0 font-medium text-green-700"
                    >
                      {row.file ? row.file.name : "New"}
                    </td>
                  );
                }

                return (
                  <td
                    key={cIndex}
                    className="px-4 py-2 border last:border-r-0 font-medium"
                  >
                    {value && value.toString().toLowerCase() !== "null"
                      ? value
                      : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InfoTable;
