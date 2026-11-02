import { useMemo } from "react";

function ImagePreview({ imageSrc, closePreview }) {
  const ext = imageSrc?.split(".").pop()?.toLowerCase();
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
  const isImage = imageExtensions.includes(ext);
  const isPdf = ext === "pdf";

  const encodedSrc = useMemo(() => {
    if (!imageSrc) return "";
    let fixed = imageSrc;
    if (fixed.startsWith("http:") && !fixed.startsWith("http://")) {
      fixed = fixed.replace("http:", "http://");
    }
    return encodeURI(fixed);
  }, [imageSrc]);

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-70">
      <div className="relative flex flex-col bg-white shadow-lg p-4 rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden">
        <button
          onClick={closePreview}
          className="top-2 right-2 z-10 absolute font-bold text-gray-700 hover:text-black text-2xl"
        >
          &times;
        </button>

        <div className="flex-1 flex justify-center items-center h-full overflow-hidden mt-6">
          {isImage ? (
            <img
              src={encodedSrc}
              alt="Preview"
              className="rounded-lg max-w-full max-h-full hover:scale-105 transition-transform duration-300 object-contain"
            />
          ) : isPdf ? (
            /* Using <object> can sometimes bypass strict iframe blocking, 
               with a clean fallback if the browser blocks it entirely */
            <object
              data={encodedSrc}
              type="application/pdf"
              className="w-full h-full rounded border"
            >
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="mb-4 text-gray-700">
                  Inline PDF preview is blocked by your browser or server security settings.
                </p>
                <a
                  href={encodedSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
                >
                  Open PDF in New Tab
                </a>
              </div>
            </object>
          ) : (
            <p className="text-gray-600 text-center">Unsupported file type.</p>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-4 text-center">
          {isPdf && (
            <a
              href={encodedSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
            >
              Open in New Tab
            </a>
          )}
          <a
            href={encodedSrc}
            download
            className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm"
          >
            Download File
          </a>
        </div>
      </div>
    </div>
  );
}

export default ImagePreview;