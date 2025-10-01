"use client";

export const dynamic = "force-dynamic"; // Disable static prerendering

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-indigo-500 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Welcome
          </h1>
          <p className="text-center text-gray-600 mb-4">Login to your ac</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-gray-700 font-medium"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your username"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 font-medium"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full bg-blue-500 text-white py-3 rounded-lg font-semibold transition duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
              }`}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Full-Screen Loader */}
      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default Page;
