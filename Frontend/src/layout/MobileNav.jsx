import { AiFillHome, AiOutlineUser } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

function MobileNave() {
  const navigate = useNavigate();

  return (
    <nav className="right-0 bottom-0 left-0 z-50 fixed flex justify-around bg-white shadow-md py-2 border-t">
      <button
        className="flex flex-col items-center text-sm"
        onClick={() => navigate("/mobile/dashboard")}
      >
        <AiFillHome size={22} />
        <span>Home</span>
      </button>
      <button
        className="flex flex-col items-center text-sm"
        onClick={() => navigate("/user/profile")}
      >
        <AiOutlineUser size={22} />
        <span>Profile</span>
      </button>
    </nav>
  );
}

export default MobileNave;
