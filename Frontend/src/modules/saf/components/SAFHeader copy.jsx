import React from "react";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationCircle,
  FaFileAlt,
  FaCopy,
} from "react-icons/fa";

const SAFHeader = ({
  applicationNo = "SAF/01/001/03044",
  status = "Payment Pending",
  submittedDate = "2024-05-15",
  applicantName = "John Doe",
}) => {
  const [copied, setCopied] = React.useState(false);

  // Status configuration with colors, icons, and messages
  const getStatusConfig = (status) => {
    const statusLower = status.toLowerCase();
    const configs = {
      approved: {
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-400",
        icon: FaCheckCircle,
        iconColor: "text-green-500",
        message: "Your application has been approved successfully!",
      },
      rejected: {
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-400",
        icon: FaTimesCircle,
        iconColor: "text-red-500",
        message:
          "Your application has been rejected. Please check the details.",
      },
      "payment pending": {
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-400",
        icon: FaClock,
        iconColor: "text-orange-500",
        message: "Payment is required to proceed with your application.",
      },
      "under review": {
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-400",
        icon: FaExclamationCircle,
        iconColor: "text-blue-500",
        message: "Your application is currently being reviewed.",
      },
      submitted: {
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-400",
        icon: FaFileAlt,
        iconColor: "text-indigo-500",
        message: "Your application has been successfully submitted.",
      },
    };

    return (
      configs[statusLower] || {
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-400",
        icon: AlertCircle,
        iconColor: "text-gray-500",
        message: "Application status updated.",
      }
    );
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(applicationNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = applicationNo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className={`${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor} rounded-lg shadow-md overflow-hidden`}
    >
      {/* Header Section */}
      <div className="px-6 py-4 border-white border-b border-opacity-30">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-white bg-opacity-50`}>
              <StatusIcon className={`w-6 h-6 ${statusConfig.iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${statusConfig.color}`}>
                Application Status
              </h2>
              <p className={`text-sm ${statusConfig.color} opacity-80`}>
                {statusConfig.message}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.color} bg-white bg-opacity-50`}
          >
            {status}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4 px-6 py-5">
        {/* Application Number */}
        <div className="flex justify-between items-center bg-white bg-opacity-50 p-4 rounded-lg">
          <div>
            <p
              className={`text-sm font-medium ${statusConfig.color} opacity-75`}
            >
              Application Number
            </p>
            <p
              className={`text-lg font-bold ${statusConfig.color} font-mono tracking-wide`}
            >
              {applicationNo}
            </p>
            <p className={`text-xs ${statusConfig.color} opacity-60 mt-1`}>
              Save this number for future references
            </p>
          </div>
          <button
            onClick={copyToClipboard}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${statusConfig.color} hover:bg-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            aria-label="Copy application number"
          >
            {copied ? (
              <>
                <Chec className="w-4 h-4" />
                <span className="font-medium text-sm">Copied!</span>
              </>
            ) : (
              <>
                <FaCopy className="w-4 h-4" />
                <span className="font-medium text-sm">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Hint */}
        {status.toLowerCase() === "payment pending" && (
          <div className="bg-orange-100 mt-4 p-4 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <FaClock className="w-5 h-5 text-orange-600" />
              <p className="text-orange-800 text-sm">
                <span className="font-semibold">Next Step:</span> Complete your
                payment to proceed with the application process.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo component to show different statuses
const SAFHeaderDemo = () => {
  const [currentStatus, setCurrentStatus] = React.useState("Payment Pending");

  const statuses = [
    "Approved",
    "Payment Pending",
    "Under Review",
    "Submitted",
    "Rejected",
  ];

  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <div className="space-y-6 mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-gray-900 text-3xl">
            SAF Application Header
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setCurrentStatus(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <SAFHeader
          status={currentStatus}
          applicationNo="SAF/01/001/03044"
          applicantName="John Doe"
          submittedDate="2024-05-15"
        />
      </div>
    </div>
  );
};

export default SAFHeaderDemo;
