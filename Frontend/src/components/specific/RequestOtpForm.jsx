import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLoading } from "../../contexts/LoadingContext";

const RequestOtpForm = ({ onOtpRequested }) => {
  const [email, setEmail] = useState("");
  const { setIsLoadingGable } = useLoading();


  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoadingGable(true);
    try {
    const ForgotPasswordApi = `${import.meta.env.VITE_REACT_APP_BACKEND_API}/api/forgot-password`;
      const response = await axios.post(ForgotPasswordApi, { email });
      toast.success(response.data.message, {
        position: 'top-right'
      });
      if(response?.data?.status){
        onOtpRequested(email);
      }else{
        setEmail("");
      }
      setIsLoadingGable(false);
    } catch (error) {
      setIsLoadingGable(false);
      toast.error(error.response?.data?.message, {
        position: 'top-right'
      });
    }
  };

  return (
    <div className="w-full">
      <form className="" onSubmit={handleRequestOtp}>
        <div className="flex flex-col">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            className="my-4 border border-slate-200 rounded-md px-3 py-2"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="my-4 w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 transition-colors duration-150"
        >
          Send OTP
        </button>
      </form>
    </div>
  );
};

export default RequestOtpForm;
