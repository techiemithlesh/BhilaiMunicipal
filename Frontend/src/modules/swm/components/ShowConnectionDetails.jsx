import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar, 
  FiCheckCircle, 
  FiXCircle, 
  FiLayers 
} from 'react-icons/fi';
import { formatLocalDate } from '../../../utils/common';

const ShowConnectionDetails = ({ 
  color,
  title = "",
  note="", 
  data = [] 
}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'current', 'historical'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filter connections by tab & search query
  const filteredConnections = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter(conn => {
      // Tab filter
      if (activeTab === 'current' && !conn.isCurrent) return false;
      if (activeTab === 'historical' && conn.isCurrent) return false;

      // Search filter across connection and sub-details
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      
      const connIdStr = conn.id ? String(conn.id) : '';
      const matchConn = connIdStr.includes(term) || 
                        conn.dateOfEffective?.toLowerCase().includes(term);

      const matchDetails = conn.connectionDetails?.some(detail => 
        detail.categoryType?.toLowerCase().includes(term) ||
        detail.subCategoryType?.toLowerCase().includes(term)
      );

      return matchConn || matchDetails;
    });
  }, [data, activeTab, searchTerm]);

  // Reset to page 1 whenever search, tab, or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, itemsPerPage]);

  // Paginated Slicing
  const totalItems = filteredConnections.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConnections = filteredConnections.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      
      {title && (
        <div
          style={{ backgroundColor: color || "#1e3a8a" }}
          className={`px-4 py-2 rounded-t-md font-bold text-white`}
        >
          {title}
        </div>
      )}
      {note && (
        <div
          className="bg-blue-50 mb-4 p-3 border-blue-500 border-l-4 rounded text-gray-700 text-sm"
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-5">
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Connections ({data.length})
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'current' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'historical' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Old
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search category, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Connection Cards / Table */}
      {paginatedConnections.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No connection details found for this view.
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedConnections.map((conn, index) => (
            <div 
              key={conn.id ?? index} 
              className={`border rounded-xl p-4 transition-all ${
                conn.is_current ? 'border-blue-200 bg-blue-50/20 shadow-xs' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Connection Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">
                    Connection #{index+1}
                  </span>
                  
                  {conn.isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Current Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                    Effective: <strong className="text-gray-700">{formatLocalDate(conn.dateOfEffective)}</strong>
                  </span>

                  <span className={`inline-flex items-center gap-1 font-medium ${conn.lockStatus ? 'text-red-600' : 'text-emerald-600'}`}>
                    {conn.lockStatus ? <FiXCircle className="w-3.5 h-3.5" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                    {conn.lockStatus ? 'Locked' : 'Unlocked'}
                  </span>
                </div>
              </div>

              {/* Nested Details Table */}
              <div className="overflow-x-auto">
                <table className="border border-gray-300 w-full text-sm border-collapse table-auto">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100 font-medium">
                      <th className="px-3 py-2 border font-semibold text-left">SL</th>
                      <th className="px-3 py-2 border font-semibold text-left">Category Type</th>
                      <th className="px-3 py-2 border font-semibold text-left">Sub Category Type</th>
                      <th className="px-3 py-2 border font-semibold text-left">No Of House/ Truck/ Room/ Area In Sqt Ft</th>
                      <th className="px-3 py-2 border font-semibold text-left">No Of Restorenet</th>
                      <th className="px-3 py-2 border font-semibold text-left">No Of Garden</th>
                      <th className="px-3 py-2 border font-semibold text-left">No Of Banquet Hall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {conn.connectionDetails && conn.connectionDetails.length > 0 ? (
                      conn.connectionDetails.map((detail, dIdx) => (
                        <tr key={detail.id ?? dIdx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2 border">{dIdx+1}</td>
                          <td className="px-3 py-2 border"> {detail.categoryType || '-'} </td>
                          <td className="px-3 py-2 border"> {detail.subCategoryType || '-'} </td>
                          <td className="px-3 py-2 border"> {detail.totalNoOfHouseAreaRoomTruck || '-'} </td>
                          <td className="px-3 py-2 border"> {detail.totalNoOfRestaurant || '-'} </td>
                          <td className="px-3 py-2 border"> {detail.totalNoOfGarden || '-'} </td>
                          <td className="px-3 py-2 border"> {detail.totalNoOfBanquetHall || '-'} </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-3 px-2 text-center text-gray-400 italic">
                          No sub-details associated with this connection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 text-xs text-gray-600">
          
          {/* Per Page Selector */}
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            <span>entries (Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems})</span>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowConnectionDetails;