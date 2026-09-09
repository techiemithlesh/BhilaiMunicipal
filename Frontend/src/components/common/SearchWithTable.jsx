import { useMemo } from "react";

const SearchWithTable = ({
  title = "Search",
  filters = [],
  onSearchSubmit = () => {},
  tableHeaders = [],
  tableData = [],
  renderRow,
  loading = false,
  setPageNo = () => {},
  setItemsPerPage = () => {},
  itemsPerPage = 10,
  totalPages = 1,
  currentPage = 1,
  totalItems = 0,
  isPaginate = true,
}) => {
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setPageNo(page);
    }
  };

  const renderPaginationButtons = useMemo(() => {
    const pages = [];
    const visiblePages = 3;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > visiblePages) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - visiblePages + 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((page, idx) =>
      page === "..." ? (
        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-500">
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-2 py-1 rounded ${
            currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {page}
        </button>
      )
    );
  }, [currentPage, totalPages, setPageNo]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search Form */}
      <div className="bg-white shadow border border-blue-800 rounded-lg">
        <h2 className="bg-blue-900 px-4 py-2 rounded-t-lg font-bold text-white text-lg">
          {title}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="gap-4 grid grid-cols-1 md:grid-cols-4 p-4"
        >
          {filters.map((filter, idx) => {
            const {
              label,
              type,
              options,
              value,
              onChange,
              placeholder,
              colSpan,
              name,
              error,
              ...rest
            } = filter;
            // Generate a unique id for each filter
            const inputId =
              filter?.name || label.replace(/\s+/g, "").toLowerCase();

            return (
              <div
                key={idx}
                className={`col-span-1 ${
                  filter.colSpan ? `md:col-span-${filter.colSpan}` : ""
                }`}
              >
                <label
                  className="block mb-1 font-medium text-sm"
                  htmlFor={inputId}
                >
                  {filter.label}
                </label>

                {filter.type === "select" ? (
                  <select
                    id={inputId}
                    name={inputId}
                    className={`bg-white px-3 py-2 border rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm ${
                      filter?.value ? "text-black" : "text-gray-500"
                    }`}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    {...rest}
                  >
                    <option value="" disabled={!filter.value}>
                      {filter.placeholder || "Select an option"}
                    </option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === "radio-group" ? (
                  <div className="flex space-x-4 pt-2">
                    {filter.options.map((opt, i) => (
                      <label
                        key={i}
                        className="flex items-center space-x-1 text-sm cursor-pointer"
                        htmlFor={`${inputId}-${opt.value}`}
                      >
                        <input
                          id={`${inputId}-${opt.value}`}
                          type="radio"
                          name={inputId}
                          value={opt.value}
                          checked={filter.value === opt.value}
                          onChange={() => filter.onChange(opt.value)}
                          className="focus:ring-blue-500 text-blue-600"
                          {...rest}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                ) : filter.type === "date" ? (
                  <input
                    id={inputId}
                    type="date"
                    name={inputId}
                    placeholder={filter.placeholder || "YYYY-MM-DD"}
                    className="px-3 py-2 border focus:border-blue-500 rounded focus:ring-2 focus:ring-blue-500 w-full text-sm transition duration-150"
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    {...rest}
                  />
                ) : filter.type === "custom" &&
                  typeof filter.render === "function" ? (
                  filter.render()
                ) : (
                  <input
                    id={inputId}
                    name={inputId}
                    type="text"
                    placeholder={filter.placeholder || "Enter keyword..."}
                    className="px-3 py-2 border focus:border-blue-500 rounded focus:ring-2 focus:ring-blue-500 w-full text-sm transition duration-150"
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    {...rest}
                  />
                )}
                {error && <span className="text-red-400 text-sm">{error}</span>}
              </div>
            );
          })}

          <div className="flex items-end">
            <button
              type="submit"
              className="bg-black hover:bg-gray-900 shadow-md px-5 py-2 rounded text-white transition duration-150"
            >
              SEARCH
            </button>
          </div>
        </form>
      </div>

      {/* Table Result */}
      <div className="bg-white shadow border border-blue-800 rounded-lg">
        <h2 className="bg-blue-900 px-4 py-2 rounded-t-lg font-bold text-white text-lg">
          Search Result
        </h2>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <div className="p-4 overflow-x-auto">
            {/* Items Per Page Selector */}
            {isPaginate && tableData.length > 0 && (
              <div className="flex justify-start items-center space-x-2 mb-4 text-sm">
                <span className="text-gray-600">Show</span>
                <select
                  className="bg-white px-2 py-1 border focus:border-blue-500 rounded focus:ring-blue-500 text-gray-700"
                  // ⭐️ Use totalItems prop to compare for "All" option
                  value={itemsPerPage === totalItems ? "all" : itemsPerPage}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue =
                      value === "all" ? totalItems : Number(value);
                    setItemsPerPage(numValue);
                    setPageNo(1);
                  }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                  {/* ⭐️ Only show 'All' if totalItems is passed and > 100 */}
                  {totalItems > 100 && (
                    <option value="all">All ({totalItems})</option>
                  )}
                </select>
                <span className="text-gray-600">items</span>
              </div>
            )}
            <div className="relative mt-4 border rounded max-h-[500px] overflow-x-auto overflow-y-auto scrollbar-hide">
              <table className="border border-gray-300 w-full min-w-[700px] border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    {tableHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="top-0 sticky bg-gray-100 px-3 py-2 border font-semibold text-sm text-left whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.length > 0 ? (
                    tableData.map((row, idx) =>
                      renderRow(row, (currentPage - 1) * itemsPerPage + idx)
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={tableHeaders.length}
                        className="py-6 text-gray-500 text-center"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {isPaginate && totalPages && (
              <div className="flex sm:flex-row flex-col justify-between items-center mt-4 text-sm">
                <span className="mb-2 sm:mb-0 text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage == 1}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 px-3 py-1 rounded text-gray-700 text-sm transition duration-150"
                  >
                    Prev
                  </button>

                  {/* Render memoized pagination buttons */}
                  {renderPaginationButtons}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage == totalPages}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 px-3 py-1 rounded text-gray-700 text-sm transition duration-150"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchWithTable;
