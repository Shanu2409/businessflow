"use client";

export const dynamic = "force-dynamic"; // Disable static prerendering

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import FullScreenLoader from "@/components/FullScreenLoader";

const Page = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/login", {
        username,
        password,
      });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("user", JSON.stringify(response.data));
      }

      toast.success("Login Successful");
      router.push("/");
    } catch (error) {
      console.log(
        "Login failed:",
        error.response ? error.response.data : error.message
      );
      toast.error("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <>
      <div className="flex min-h-screen">
        {/* Left side - Brand/Logo */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90"></div>
          <div className="z-10 p-12 max-w-lg text-center">
            <img
              src="https://raw.githubusercontent.com/Shanu2409/businessflow/refs/heads/master/assets/logo.png"
              alt="BusinessFlow Logo"
              className="w-64 h-auto mx-auto mb-8"
            />
            <h1 className="text-4xl font-bold text-white mb-6">
              Welcome to BusinessFlow
            </h1>
            <p className="text-xl text-white text-opacity-90 mb-8">
              Manage your business operations efficiently with our comprehensive
              platform.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <div className="text-white text-4xl mb-4">
                  <FaUser />
                </div>
                <h3 className="text-white text-xl font-semibold mb-2">
                  User Management
                </h3>
                <p className="text-white text-opacity-80">
                  Easily manage users and permissions
                </p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <div className="text-white text-4xl mb-4">
                  <FaLock />
                </div>
                <h3 className="text-white text-xl font-semibold mb-2">
                  Secure Access
                </h3>
                <p className="text-white text-opacity-80">
                  Powerful security for your business data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6">
          <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-card animate-fade-in">
            <div className="text-center mb-8">
              <div className="lg:hidden mb-6">
                <img
                  src="https://raw.githubusercontent.com/Shanu2409/businessflow/refs/heads/master/assets/logo.png"
                  alt="BusinessFlow Logo"
                  className="w-48 h-auto mx-auto"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Sign in to your account
              </h2>
              <p className="text-gray-600 mt-2">
                Enter your credentials to access the dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="flex justify-between">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm text-primary hover:text-secondary"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full btn btn-primary ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
              <p>
                © {new Date().getFullYear()} BusinessFlow. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Loader */}
      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default Page;
