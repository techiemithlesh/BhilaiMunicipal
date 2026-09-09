import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../contexts/LoadingContext";

const ResetPasswordForm = ({ email }) => {
  const [otp, setOtp] = useState("");
  const [isToken, setIsToken] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");
  const { setIsLoadingGable } = useLoading();
  const [errors, setErrors] = useState({});


  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoadingGable(true);
    try {
      const verifyOTPApi = `${import.meta.env.VITE_REACT_APP_BACKEND_API}/api/otp-verify`;
      const response = await axios.post(verifyOTPApi, {
        email,
        otp,
      });
      toast.success(response.data.message, {
        position: 'top-right'
      });
      setIsToken(response.data?.status);
      setToken(response.data.data.token);

    } catch (error) {
      toast.error(error.response?.data?.message || "Error resetting password");
    }finally{
      setIsLoadingGable(false);
    }
  };


  const handleNewPasswordReset = async (e) => {
    e.preventDefault();
    setIsLoadingGable(true);
    try {
      const resetPasswordApi = `${import.meta.env.VITE_REACT_APP_BACKEND_API}/api/otp-change-pass`;
      const response = await axios.post(resetPasswordApi, {
        token,
        newPassword,
      });
      
      toast.success(response.data.message, {
        position: 'top-right'
      });
      if (!response.data?.status) {
        setErrors(response.data.errors || {});
      } else {
        setErrors({});
        navigate('/login');
        // success logic here
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error resetting password");
    }finally{
      setIsLoadingGable(false);
    }
  };

  return (
    <form onSubmit={isToken ? handleNewPasswordReset : handleResetPassword} className="space-y-6">
      {!isToken && (
        <div className="flex flex-col">
          <label htmlFor="otp" className="text-sm font-medium text-gray-700">
            OTP:
          </label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}

      {isToken && (
        <div className="flex flex-col">
          <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
            New Password:
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword[0]}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full inline-flex justify-center rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150"
      >
        {isToken ? "Set New Password" : "Verify OTP"}
      </button>
    </form>
  );
};

export default ResetPasswordForm;
