import React, { useState } from "react";
import InputField from "../common/InputField";
import { validateForm } from "../../utils/validation";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { loginChangePassApi } from "../../api/endpoints";
import { toastMsg } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { modalVariants } from "../../utils/motionVariable";
import { FaTimes, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Spinner } from "@nextui-org/react";

/* ================= PASSWORD RULE CHECK ================= */
const getPasswordRulesStatus = (password = "") => ({
  length: password.length >= 6,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

function ChangePassword({ onClose }) {
  const token = getToken();
  const navigate = useNavigate();

  const [isFrozen, setIsFrozen] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [passwordRules, setPasswordRules] = useState(
    getPasswordRulesStatus("")
  );

  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  /* ================= VALIDATION ================= */
  const validationRules = {
    oldPassword: {
      required: true,
      message: "Old password is required",
    },
    newPassword: {
      required: true,
      minLength: 6,
      regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
      message:
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character",
    },
    conformPassword: {
      required: true,
      minLength: 6,
      message: "Confirm password is required",
    },
  };

  /* ================= HANDLERS ================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));

    if (name === "newPassword") {
      setPasswordRules(getPasswordRulesStatus(value));
    }
  };

  const togglePassword = (key) =>
    setShowPassword((p) => ({ ...p, [key]: !p[key] }));

  const handleFormSubmit = async () => {
    const clientErrors = validateForm(formData, validationRules);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    if (formData.newPassword !== formData.conformPassword) {
      setErrors({ conformPassword: "Passwords do not match" });
      return;
    }

    setIsFrozen(true);

    try {
      const res = await axios.post(loginChangePassApi, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.status) {
        toastMsg(res.data.message, "success");
        onClose();
        navigate("/login");
      } else {
        toastMsg(res.data.message, "error");
        setErrors(res.data.errors || {});
      }
    } finally {
      setIsFrozen(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <FaLock className="text-red-600" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className="relative px-6 py-5">
          <div className={`space-y-4 ${isFrozen ? "opacity-60" : ""}`}>
            <PasswordInput
              label="Old Password"
              name="oldPassword"
              value={formData.oldPassword}
              error={errors.oldPassword}
              show={showPassword.old}
              onToggle={() => togglePassword("old")}
              onChange={handleInputChange}
            />

            <PasswordInput
              label="New Password"
              name="newPassword"
              value={formData.newPassword}
              error={errors.newPassword}
              show={showPassword.new}
              onToggle={() => togglePassword("new")}
              onChange={handleInputChange}
            />

            {/* PASSWORD SUGGESTIONS */}
            <div className="space-y-1 text-xs">
              <PasswordRule text="At least 6 characters" valid={passwordRules.length} />
              <PasswordRule text="One uppercase letter (A-Z)" valid={passwordRules.upper} />
              <PasswordRule text="One lowercase letter (a-z)" valid={passwordRules.lower} />
              <PasswordRule text="One number (0-9)" valid={passwordRules.number} />
              <PasswordRule text="One special character (!@#$)" valid={passwordRules.special} />
            </div>

            <PasswordInput
              label="Confirm Password"
              name="conformPassword"
              value={formData.conformPassword}
              error={errors.conformPassword}
              show={showPassword.confirm}
              onToggle={() => togglePassword("confirm")}
              onChange={handleInputChange}
            />

            <div className="flex justify-end pt-4">
              <button
                onClick={handleFormSubmit}
                disabled={isFrozen}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* LOADER */}
          {isFrozen && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-2xl">
              <Spinner size="sm" />
              <span className="ml-2">Processing...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ================= PASSWORD INPUT ================= */
const PasswordInput = ({
  label,
  name,
  value,
  error,
  show,
  onToggle,
  onChange,
}) => (
  <div className="relative">
    <InputField
      label={label}
      name={name}
      type={show ? "text" : "password"}
      value={value ?? ""}
      onChange={onChange}
      error={error}
      className="pr-10"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-[38px] cursor-pointer text-gray-500 hover:text-gray-700"
    >
      {show ? <FaEyeSlash /> : <FaEye />}
    </button>
  </div>
);

/* ================= PASSWORD RULE ITEM ================= */
const PasswordRule = ({ text, valid }) => (
  <div
    className={`flex items-center gap-2 ${
      valid ? "text-green-600" : "text-gray-400"
    }`}
  >
    <span>{valid ? "✔" : "•"}</span>
    <span>{text}</span>
  </div>
);

export default ChangePassword;
