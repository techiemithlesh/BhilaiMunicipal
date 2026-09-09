import React from 'react';

function PreviewFormTableData({ title, header, data }) {
    if (!Array.isArray(data) || data.length === 0) {
        return null; 
    }

    return (
        <div className="flex flex-col gap-4 bg-white shadow p-6 border-green-500 border-t-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 text-xl">
                {title}
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Rendering Headers */}
                            {header?.map((head, index) => (
                                <th 
                                    key={index} 
                                    className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider"
                                >
                                    {head?.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Rendering Data Rows */}
                        {data.map((app, idx) => (
                            <tr key={app.id || idx}>
                                {/* Rendering Data Cells */}
                                {header?.map((val, keys) => (
                                    <td 
                                        key={`${idx}-${val.key}`} 
                                        className="px-4 py-2 border border-gray-500 font-medium text-gray-900 text-sm whitespace-nowrap"
                                    >
                                        {app[val.key] || ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PreviewFormTableData;