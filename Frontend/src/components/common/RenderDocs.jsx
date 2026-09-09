import { FaFilePdf, FaUpload } from "react-icons/fa";

const RenderDocs = ({
  list,
  title,
  owner,
  setSelectedOwner,
  setDocCode,
  setSelectedDoc,
  setIsSubModal,
}) => (
  <div className="mb-4">
    {title && <h3 className="mb-2 font-bold text-blue-800 text-lg">{title}</h3>}

    <table className="mb-6 border rounded min-w-full overflow-hidden text-sm">
      <thead className="sticky top-0 bg-blue-800 text-white">
        <tr>
          <th className="p-2 border">#</th>
          <th className="p-2 border">Document Type</th>
          <th className="p-2 border">Options</th>
          <th className="p-2 border">File</th>
          <th className="p-2 border">Document Name</th>
          <th className="p-2 border text-center">Action</th>
        </tr>
      </thead>

      <tbody>
        {list?.length ? (
          list.map((item, index) => (
            <tr key={index} className="even:bg-gray-50 odd:bg-white border-t">
              <td className="p-2 border text-center">{index + 1}</td>

              <td className="p-2 border">
                {item.docName || item.docCode}
                {item?.isMadetory && <span className="text-red-600">*</span>}
              </td>

              <td className="p-2 border text-center">{item.docListNames}</td>

              <td className="p-2 border text-center">
                {item.uploadedDoc ? (
                  item.uploadedDoc.toLowerCase().includes(".pdf") ? (
                    <FaFilePdf
                      size={40}
                      className="mx-auto text-red-600 cursor-pointer"
                    />
                  ) : (
                    <img
                      src={item.uploadedDoc}
                      className="mx-auto w-10 h-10 rounded-full border cursor-pointer"
                      alt="doc"
                    />
                  )
                ) : (
                  <span className="text-gray-400">No file</span>
                )}
              </td>

              <td className="p-2 border text-center">
                {item.uploadedDocName || "-"}
              </td>

              <td className="p-2 border text-center">
                <button
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white"
                  onClick={() => {
                    setSelectedOwner(owner);
                    setDocCode(item.docCode);
                    setSelectedDoc(item);
                    setIsSubModal(true);
                  }}
                >
                  <FaUpload />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="p-4 text-gray-500 text-center">
              No documents found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default RenderDocs;
