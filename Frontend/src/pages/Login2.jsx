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
  validatePassword,
  validateEmail,
} from "../utils/validation";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import axios from "axios";
import OtpModal from "../components/specific/OtpModel";

const Login2 = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return validateEmail(value);
      case "username":
        return validateUsername(value);
      case "password":
        return validatePassword(value);
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
    const loginApi = `${import.meta.env.VITE_REACT_APP_BACKEND_API}/api/login`;

    try {
      const response = await axios.post(loginApi, {
        ...formData,
        ...browserInfo,
      });

      if (response.data && response.data.status === true) {
        const { token, userDetails } = response.data.data;

        setAuthToken(token, userDetails);

        toast.success(response.data.message, {
          position: "top-right",
        });

        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Login Failed!");
      setErrors(error);
    }
  };

  return (
    <Layout>
      <div className="flex md:flex-row flex-col justify-center items-center bg-zinc-100 p-4 min-h-screen">
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
          className="bg-white shadow-lg p-8 rounded-lg w-full md:w-1/2 max-w-md h-400"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <h1 className="font-bold text-3xl text-center">Login</h1>
            </div>
            <div>
              <label
                htmlFor="Email"
                className="block font-medium text-zinc-700 text-sm"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                required
                className="block shadow-sm mt-1 px-3 py-2 border border-zinc-300 focus:border-primary rounded-md focus:outline-none focus:ring-primary w-full sm:text-sm"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && <p className="text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label
                htmlFor="username"
                className="block font-medium text-zinc-700 text-sm"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="block shadow-sm mt-1 px-3 py-2 border border-zinc-300 focus:border-primary rounded-md focus:outline-none focus:ring-primary w-full sm:text-sm"
                value={formData.username}
                onChange={handleInputChange}
              />
              {errors.username && (
                <p className="text-red-500">{errors.username}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-zinc-700 text-sm"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  className="block shadow-sm mt-1 px-3 py-2 border border-zinc-300 focus:border-primary rounded-md focus:outline-none focus:ring-primary w-full sm:text-sm"
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
              <Button
                title="Sign In"
                className="flex justify-center bg-primary hover:bg-primary/80 shadow-sm px-4 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full font-medium text-white text-sm"
                onClick={handleLogin}
              />
            </div>
          </form>
        </motion.div>
        {showOtpModal && <OtpModal onClose={closeModal} />}
      </div>
    </Layout>
  );
};

export default Login2;
