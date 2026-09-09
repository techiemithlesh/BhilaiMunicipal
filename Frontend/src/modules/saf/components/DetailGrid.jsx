import React from "react";

const DetailGrid = ({ title, note, data = [] }) => {
  const isJSXData = React.isValidElement(data[0]);

  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      {title && (
        <div className="bg-blue-900 px-4 py-2 rounded-t-md font-semibold text-white text-sm">
          {title}
        </div>
      )}

      <div className="space-y-2 p-4">
        {note && (
          <p className="flex items-center gap-2 text-red-600 text-sm italic">
            <span>⚠️</span> {note}
          </p>
        )}

          {isJSXData ? (
            <div className="space-y-4">{data}</div>
        ) :
        (
          <div className="gap-x-12 gap-y-2 grid grid-cols-1 md:grid-cols-2 text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex">
                <span className="w-1/2 font-medium text-gray-600">
                  {item.label}
                </span>
                <span className="w-1/2 font-semibold text-black">
                  {typeof item.value === "boolean" ? (
                    <input type="checkbox" checked={item.value} readOnly />
                  ) : (
                    item.value || "NA"
                  )}
                </span>
              </div>
            ))}
          </div>

        )}
      </div>
    </div>
  );
};

export default DetailGrid;
