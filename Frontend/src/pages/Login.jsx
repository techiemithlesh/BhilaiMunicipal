import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  clearAuth,
  getToken,
  getUserDetails,
  setAuthToken,
} from "../utils/auth";
import toast from "react-hot-toast";
import Layout from "../layout/Layout";
import BannerImg from "../assets/images/LoginBanner.png";
import {
  validateUsername,
  validateEmail,
  validateLoginPassword,
} from "../utils/validation";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import axios from "axios";
import OtpModal from "../components/specific/OtpModel";
import { heartBeatApi, loginApi } from "../api/endpoints";
import { useLoading } from "../contexts/LoadingContext";

const Login = () => {
  const { setIsLoadingGable } = useLoading();
  const [formData, setFormData] = useState({
    email: "",
    userName: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    userName: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    testHeartBeat();
  }, []);

  const testHeartBeat = async () => {
    const token = getToken();
    try {
      const { data } = await axios.post(
        heartBeatApi,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data?.status || !data?.authenticated) {
        clearAuth();
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error during heartbeat:", error);
      // navigate("/login", { replace: true }); // fallback on error
    }
  };

  const toggleInputMethodRadio = (e) => {
    setUseEmail(e.target.value === "Email");
  };

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        return useEmail ? validateEmail(value) : "";
      case "userName":
        return !useEmail ? validateUsername(value) : "";
      case "password":
        return validateLoginPassword(value);
      default:
        return "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    const errorMessage = validateField(name, value);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  };

  const browserInfo = JSON.parse(localStorage.getItem("browserInfo"));

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setIsLoadingGable(true);

    const validationErrors = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) validationErrors[name] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      setIsLoadingGable(false);
    } else {
      try {
        const payload = formData;

        if (useEmail) {
          payload.userName = "";
        }
        if (!useEmail) {
          payload.email = "";
        }

        const response = await axios.post(loginApi, {
          ...payload,
          ...browserInfo,
        });

        if (response.data && response.data.status === true) {
          const { token, userDetails } = response.data.data;
          setAuthToken(token, userDetails);

          toast.success(response.data.message, {
            position: "top-right",
          });

          navigate("/dashboard");
        } else if (
          response.data &&
          response.data.status !== true &&
          response.data?.errors
        ) {
          setErrors(response.data?.errors);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error("Login Failed!");
        setErrors(error);
      } finally {
        setIsLoading(false);
        setIsLoadingGable(false);
      }
    }
  };

  const closeModal = () => {
    setShowOtpModal(false);
  };

  return (
    <Layout>
      <div className="flex md:flex-row flex-col justify-center items-center bg-zinc-100 p-4">
        <motion.div
          className="flex justify-center mb-8 md:mb-0 w-full md:w-1/3"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={BannerImg}
            alt="Login Banner"
            className="w-3/4 md:w-full h-400"
          />
        </motion.div>
        <motion.div
          className="bg-white shadow-lg p-8 w-full md:w-1/2 max-w-md h-400"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
              <h1 className="font-bold text-3xl text-center">Login</h1>
            </div>

            <div className="flex justify-center gap-4">
              <label>
                <input
                  type="radio"
                  name="radioButton"
                  value="Email"
                  checked={useEmail}
                  onChange={toggleInputMethodRadio}
                  className="mr-1"
                />
                Email
              </label>
              <label>
                <input
                  type="radio"
                  name="radioButton"
                  value="UserName"
                  checked={!useEmail}
                  onChange={toggleInputMethodRadio}
                  className="mr-1"
                />
                Username
              </label>
            </div>
            {useEmail ? (
              <div>
                <label
                  htmlFor="Email"
                  className="block font-medium text-zinc-700 text-sm"
                >
                  Email
                  <input
                    type="text"
                    id="email"
                    name="email"
                    required
                    className="block shadow-sm px-3 py-2 border border-zinc-300 focus:border-primary rounded-md focus:outline-none focus:ring-primary w-full sm:text-sm"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </label>
                {errors.email && <p className="text-red-500">{errors.email}</p>}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="userName"
                  className="block font-medium text-zinc-700 text-sm"
                >
                  Username
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    required
                    className="block shadow-sm px-3 py-2 border border-zinc-300 focus:border-primary rounded-md focus:outline-none focus:ring-primary w-full sm:text-sm"
                    value={formData.userName}
                    onChange={handleInputChange}
                  />{" "}
                </label>
                {errors.userName && (
                  <p className="text-red-500">{errors.userName}</p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block font-medium text-zinc-700 text-sm"
              >
                Password
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    className="block shadow-sm px-3 py-2 border border-zinc-300 focus:border-primary rounded-md focus:outline-none focus:ring-primary w-full sm:text-sm"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <div
                    className="right-0 absolute inset-y-0 flex items-center pr-3 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </div>
                </div>
              </label>
              {errors.password && (
                <p className="text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="border-zinc-300 rounded focus:ring-primary w-4 h-4 text-primary"
                />
                <label
                  htmlFor="remember_me"
                  className="block ml-2 text-zinc-900 text-sm"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="#"
                  onClick={() => setShowOtpModal(true)}
                  className="font-medium text-primary hover:text-black-foreground"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="flex justify-center items-center bg-primary hover:bg-primary/80 shadow-sm px-4 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full font-medium text-white text-sm"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </motion.div>
        {showOtpModal && <OtpModal onClose={closeModal} />}
      </div>
    </Layout>
  );
};

export default Login;
