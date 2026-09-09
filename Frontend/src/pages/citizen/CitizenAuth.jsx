import { useEffect, useState } from "react";
import { FaUser, FaMobileAlt } from "react-icons/fa";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  citizenLoginApi,
  citizenLoginOtpApi,
  citizenRegisterVerifyOtpApi,
  googleAuthApi,
  registerCitizenApi,
  socialClientIdApi,
} from "../../api/endpoints";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/slices/citizenAuthSlice";
import { Spinner } from "@nextui-org/react";
import { toastMsg } from "../../utils/utils";

const CitizenAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [authType, setAuthType] = useState("login");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [googleClientId, setGoogleClientId] = useState(null);
  const [isSpinner, setIsSpinner] = useState(false);
  const [isBtnDisabled, setIsBtnDisabled] = useState(false);

  // Reset form state
  const resetState = () => {
    setMobile("");
    setOtp("");
    setOtpSent(false);
    setName("");
  };

  // Fetch Google Client ID from API
  useEffect(() => {
    const fetchGoogleClientId = async () => {
      setIsSpinner(true);
      try {
        const res = await axios.post(socialClientIdApi, {
          client: "google",
        });
        if (res.data?.data?.clientId) {
          setGoogleClientId(res.data.data.clientId);
        }
      } catch (error) {
        console.error("Failed to fetch Google Client ID", error);
      } finally {
        setIsSpinner(false);
      }
    };

    fetchGoogleClientId();
  }, []);

  const handleSendOtp = async (otpApi) => {
    if (authType === "register" && name.trim() === "") {
      toastMsg("Please enter your full name to register","error");
      return;
    }

    if (!mobile.trim()) {
      toastMsg("Please enter your mobile number","error");
      return;
    }

    const payload = {
      mobile: mobile,
      otpType: authType === "login" ? "Login" : "Register",
    };

    if (authType === "register") {
      payload.name = name; // Include name for registration
    }

    // Show loading toast
    const toastId = toast.loading("Sending OTP...");
    setIsBtnDisabled(true);
    try {
      const response = await axios.post(otpApi, payload);

      toast.dismiss(toastId);

      if (response.data.status === true) {
        toast.success(response.data.message, { duration: 10000 });
        setOtpSent(true);
      } else {
        toast.error(response.data?.message, {
          duration: 10000,
        });
        return;
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to send OTP. Please try again.", { duration: 10000 });
    }finally{
      setIsBtnDisabled(false);
    }
  };

  // OTP Verification
  const handleVerifyOtp = async (otpType, otpApi) => {
    setIsBtnDisabled(true)
    try{
      if (otp.trim() === "") {
        toast.error("Please enter the OTP");
        return;
      }

      const browserInfo = await JSON.parse(localStorage.getItem("browserInfo"));

      const payload = {
        mobile: mobile,
        otp: otp,
        otpType: otpType,
        latitude: browserInfo.latitude,
        longitude: browserInfo.longitude,
        machine: browserInfo.machine,
        browserName: browserInfo.browserName,
        ip: browserInfo.ip,
      };

      if (otpType === "Register") {
        payload.name = name; // Include name for registration
      }

      const response = await axios.post(otpApi, {
        mobile: mobile,
        otp: otp,
        otpType: otpType,
        latitude: browserInfo.latitude,
        longitude: browserInfo.longitude,
        machine: browserInfo.machine,
        browserName: browserInfo.browserName,
        ip: browserInfo.ip,
      });
      if (response.data.status === true) {
        toastMsg("OTP verified successfully!");
        const { token, userDetails } = response.data.data;
        dispatch(loginSuccess({ token, userDetails }));
        navigate("/citizen/");
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    }catch (error) {
      console.error("error:", error);
    }finally {
      setIsBtnDisabled(false); // 👈 hide overlay
    }
    
  };

  // Handle Google Login
  const handleGoogleLogin = async (credentialResponse) => {
    setIsSpinner(true);
    try {
      const res = await axios.post(googleAuthApi, {
        token: credentialResponse.credential,
      });

      if (res?.data?.status) {
        toast.success("Google Login Successful!", {position: 'top-right'});
        const { token, userDetails } = res.data.data;
        dispatch(loginSuccess({ token, userDetails }));
        navigate("/citizen/");
      }
    } catch (err) {
      console.error("Google Login Failed:", err.response?.data || err.message);
      toast.error("Google Login Failed!", {position:'top-right'});
    } finally {
      setIsSpinner(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="flex justify-center items-center bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-8">
        <div className="flex flex-col gap-4 bg-white shadow-2xl p-8 rounded-2xl w-full max-w-lg">
          {/* Toggle Auth Type */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setAuthType("login");
                resetState();
              }}
              className={`px-6 py-1 rounded-full font-semibold ${
                authType === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthType("register");
                resetState();
              }}
              className={`px-6 py-1 rounded-full font-semibold ${
                authType === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              disabled={isBtnDisabled}
            >
              Register
            </button>
          </div>

          <h2 className="font-bold text-gray-800 text-xl text-center">
            {authType === "login" ? "Login" : "Register"} to Citizen Portal
          </h2>

          {!otpSent ? (
            <div className="flex flex-col items-center gap-4">
              {authType === "register" ? (
                <div className="flex items-center px-4 py-2 border rounded-lg w-full">
                  <FaUser className="mr-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="flex-1 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="flex items-center px-4 py-2 border rounded-lg w-full">
                <FaMobileAlt className="mr-3 text-gray-500" />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  className="flex-1 outline-none"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <button
                onClick={() =>
                  handleSendOtp(
                    authType === "login"
                      ? citizenLoginOtpApi
                      : registerCitizenApi
                  )
                }
                className={`${isBtnDisabled ?"bg-gray-400 hover:bg-gray-300":"bg-yellow-400 hover:bg-yellow-500" } py-2 rounded-full w-full max-w-40 font-bold text-black text-lg transition`}
                disabled={isBtnDisabled}
              >
                Send OTP
              </button>

              <div className="flex justify-center items-center">
                <span className="px-2 text-gray-400 text-sm">OR</span>
              </div>

              {isSpinner ? (
                <div className="loading">
                  <Spinner />
                </div>
              ) : (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => toast.error("Google Login Failed")}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="font-semibold text-green-700 text-center">
                OTP Sent Successfully!
              </div>
              <input
                type="text"
                placeholder="Enter OTP"
                className="px-4 py-3 border rounded-lg outline-none w-full"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                onClick={() =>
                  handleVerifyOtp(
                    authType === "login" ? "Login" : "Register",
                    authType === "login"
                      ? citizenLoginApi
                      : citizenRegisterVerifyOtpApi
                  )
                }
                className={`${isBtnDisabled ? "bg-gray-400 hover:bg-gray-300" : "bg-blue-600 hover:bg-blue-700"} py-1 rounded-full w-full max-w-40 font-bold text-white transition`}
                disabled={isBtnDisabled}
              >
                Verify OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default CitizenAuth;
