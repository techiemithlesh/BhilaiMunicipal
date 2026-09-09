import { useState } from "react";
import { FaInbox, FaPhone } from "react-icons/fa";
import { MdEdit, MdVisibility } from "react-icons/md";
import { Link } from "react-router-dom";
import ProfileViewCard from "../specific/ProfileViewCard";
import defaultAvatar from "../../assets/images/default-avatar.jpg";

const ProfileCard = ({ user }) => {
  const [isModelOpen, setIsModelOpen] = useState(false);

  const closeModal = () => setIsModelOpen(false);
  const openModal = () => setIsModelOpen(true);

  return (
    <div className="bg-white shadow-md p-4 sm:p-6 border border-gray-200 rounded-lg max-w-full sm:max-w-sm h-fit">
      <h2 className="font-bold text-gray-700 text-lg">Profile Section</h2>

      {/* Profile Info Section */}
      <div className="flex sm:flex-row flex-col items-center sm:items-start mt-4">
        {/* Avatar */}
        <div className="flex justify-center items-center bg-gray-200 rounded-full w-24 h-24">
          <img
            src={user?.userImg || defaultAvatar}
            alt={user?.name}
            className="rounded-full w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="mt-4 sm:mt-0 sm:ml-6 sm:text-left text-center">
          <h3 className="font-bold text-black text-xl">{user?.name}</h3>
          <p className="text-gray-600">
            {user?.roles?.length > 0 ? user?.roles[0]?.roleName : ""}
          </p>
          <p className="flex justify-center sm:justify-start items-center text-gray-600">
            <FaInbox className="mr-2" /> {user?.email || "NA"}
          </p>
          <p className="flex justify-center sm:justify-start items-center text-gray-600">
            <FaPhone className="mr-2" /> {user?.phoneNo || "NA"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex sm:flex-row flex-col gap-3 mt-6">
        <Link
          to={`/user/profile/`}
          className="flex justify-center items-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          <MdEdit className="mr-2" /> Update
        </Link>
        <button
          onClick={openModal}
          className="flex justify-center items-center bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          <MdVisibility className="mr-2" /> View
        </button>
      </div>

      {/* Modal View */}
      {isModelOpen && (
        <ProfileViewCard
          isOpen={isModelOpen}
          onClose={closeModal}
          user={user}
        />
      )}
    </div>
  );
};

export default ProfileCard;
