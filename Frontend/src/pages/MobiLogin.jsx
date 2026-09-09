import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { setAuthToken } from "../utils/auth";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
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
import { loginApi } from "../api/endpoints";
import { Spinner } from "@nextui-org/react";
import { useLoading } from "../contexts/LoadingContext";

function MobiLogin() {
  const { setIsLoadingGable } = useLoading();
  const [formData, setFormData] = useState({
    email: "",
    userName: "",
    password: "",
    type: "mobile",
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

  const toggleInputMethodRadio = (e) => {
    setUseEmail(e.target.value === "Email");
  };

  const navigate = useNavigate();

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

        if (useEmail) payload.userName = "";
        if (!useEmail) payload.email = "";

        const response = await axios.post(loginApi, {
          ...payload,
          ...browserInfo,
        });

        if (response.data?.status === true) {
          const { token, userDetails } = response.data.data;
          setAuthToken(token, userDetails);
          toast.success(response.data.message, { position: "top-right" });
          navigate("/mobile/dashboard");
        } else if (response.data?.errors) {
          setErrors(response.data.errors);
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
      <div className="relative flex flex-col md:flex-row items-center justify-center min-h-screen bg-zinc-100 p-4 overflow-hidden">
        {/* Background Image */}
        <img
          src={BannerImg}
          alt="Login Background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 z-0"
        />

        {/* Foreground Form */}
        <motion.div
          className="relative z-10 w-full md:w-1/2 max-w-md bg-white bg-opacity-90 p-8 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading && (
            <div className="loading">
              <Spinner />
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <h1 className="text-center text-3xl font-bold">Login</h1>

            <div className="flex justify-center mb-4">
              <label className="mr-4">
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
                <label className="block text-sm font-medium text-zinc-700">Email</label>
                <input
                  type="text"
                  name="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <p className="text-red-500">{errors.email}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-zinc-700">Username</label>
                <input
                  type="text"
                  name="userName"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={formData.userName}
                  onChange={handleInputChange}
                />
                {errors.userName && <p className="text-red-500">{errors.userName}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                </div>
              </div>
              {errors.password && <p className="text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-zinc-900">
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
}

export default MobiLogin;
