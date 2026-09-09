import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { modalVariants } from "../../utils/motionVariable";
import defaultAvatar from "../../assets/images/default-avatar.jpg";

const ProfileViewCard = ({ onClose, user }) => {
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75 p-2 sm:p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl rounded-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {/* Sticky Header */}
          <div className="top-0 z-10 sticky flex justify-between items-center bg-white mb-4 pb-3 border-b">
            <h2 className="font-semibold text-gray-800 text-xl sm:text-2xl">
              User Details
            </h2>
            <button
              className="text-gray-600 hover:text-gray-800"
              onClick={onClose}
            >
              <FaTimes size={22} />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-wrap gap-y-6">
            {/* Profile Image & Name */}
            <div className="flex flex-col items-center px-2 w-full sm:w-1/3 text-center">
              <img
                src={user?.userImg || defaultAvatar}
                alt={user?.name}
                className="shadow mb-2 rounded-full w-24 h-24 object-cover"
              />
              <p className="font-bold text-lg">{user?.name}</p>
              <p className="text-gray-500 text-sm">
                {user?.roles?.[0]?.roleName || "No Role"}
              </p>
            </div>

            {/* Details Grid */}
            <div className="px-2 w-full sm:w-2/3">
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>First Name:</strong> {user?.firstName}
                  </p>
                  <p>
                    <strong>Middle Name:</strong> {user?.middleName || "NA"}
                  </p>
                  <p>
                    <strong>Last Name:</strong> {user?.lastName}
                  </p>
                  <p>
                    <strong>Guardian Name:</strong> {user?.guardianName || "NA"}
                  </p>
                  <p>
                    <strong>Designation:</strong> {user?.designation}
                  </p>
                  <p>
                    <strong>Employee Code:</strong> {user?.employeeCode}
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Email:</strong> {user?.email || "NA"}
                  </p>
                  <p>
                    <strong>Phone No:</strong> {user?.phoneNo || "NA"}
                  </p>
                  <p>
                    <strong>User Name:</strong> {user?.userName}
                  </p>
                  <p>
                    <strong>Unique Ref No:</strong> {user?.uniqueRefNo || "NA"}
                  </p>
                  <div>
                    <p>
                      <strong>Signature Img:</strong>
                    </p>
                    <img
                      src={
                        user?.signatureImg || "https://via.placeholder.com/150"
                      }
                      alt="Signature"
                      className="mt-1 rounded w-16 h-16 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ward Permissions */}
            <div className="px-2 w-full">
              <p className="mb-2 font-semibold text-gray-700">
                Wards Permission:
              </p>
              <div className="gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12">
                {user?.wardPermission?.map((ward) => (
                  <button
                    key={ward.id}
                    className="bg-white hover:bg-blue-500 px-3 py-1 border border-blue-200 rounded text-blue-700 hover:text-white text-sm transition"
                  >
                    {ward.wardNo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileViewCard;
