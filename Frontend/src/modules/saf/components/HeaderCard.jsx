const HeaderCard = ({ applicationNo, statusText, statusColor }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(applicationNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white shadow p-2 px-4 border border-blue-800 rounded-lg">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Icon and Info */}
        <div className="flex items-center gap-4">
          <div className="text-blue-600 text-2xl">
            <FaInfoCircle />
          </div>
          <div>
            <p className="flex items-center text-gray-700 text-sm">
              Your applied application no. is{" "}
              <span className="font-bold text-orange-600 text-xl">
                {applicationNo}
              </span>
              <button
                onClick={handleCopy}
                className="ml-2 text-gray-500 hover:text-blue-700 transition"
                title="Copy Application No."
              >
                {copied ? (
                  <FaCheckCircle className="inline-block text-green-600" />
                ) : (
                  <FaRegCopy className="inline-block" />
                )}
              </button>
              . You can use this for future reference.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-blue-50 px-4 py-2 border border-blue-200 rounded-md font-semibold text-green-700 text-sm">
          Current Status:{" "}
          <span className={`font-bold ${statusColor}`}>{statusText}</span>
        </div>
      </div>
    </div>
  );
};

export default HeaderCard;
