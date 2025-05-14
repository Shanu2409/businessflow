"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FaUniversity,
  FaRegCreditCard,
  FaCode,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-toastify";
import FullScreenLoader from "./FullScreenLoader";

const AddBankForm = ({ setShowAddBankForm, fetchData, editData }) => {
  const [loading, setLoading] = useState(false);

  // Single state object for all form fields
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    current_balance: "",
    check: false,
  });

  const [initialBankName, setInitialBankName] = useState("");

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  };

  // Populate Form if Editing
  useEffect(() => {
    if (editData) {
      setFormData({
        bank_name: editData.bank_name || "",
        account_number: editData.account_number || "",
        ifsc_code: editData.ifsc_code || "",
        current_balance: editData.current_balance || "",
      });
      setInitialBankName(editData.bank_name || "");
    }
  }, [editData]);

  // Reset Form State & Close Form
  const resetForm = () => {
    setFormData({
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      current_balance: "",
    });
    setShowAddBankForm(false);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.bank_name ||
      !formData.account_number ||
      !formData.ifsc_code ||
      !formData.current_balance
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        const bankNameChanged = initialBankName !== formData.bank_name;
        const updateData = { ...formData };

        let apiUrl = `/api/banks/${initialBankName}`;

        if (bankNameChanged) {
          updateData.bank_name = formData.bank_name;
        } else {
          updateData.bank_name = initialBankName;
        }
        try {
          const response = await axios.put(apiUrl, updateData);
          toast.success(
            response?.data?.Message || "Bank details updated successfully"
          );
          fetchData();
          resetForm();
        } catch (err) {
          if (err.response && err.response.status === 400) {
            toast.error(
              err.response.data.Message || "Bank with this name already exists"
            );
            setLoading(false);
            return;
          } else {
            throw err;
          }
        }
      } else {
        let user;
        if (typeof window !== "undefined") {
          user = JSON.parse(sessionStorage.getItem("user") || "{}");
        }

        try {
          const response = await axios.post("/api/banks", {
            ...formData,
            created_by: user.username,
          });

          toast.success(response.data.Message || "Bank added successfully");
          fetchData();
          resetForm();
        } catch (err) {
          // Check for specific error responses
          if (err.response && err.response.status === 400) {
            toast.error(
              err.response.data.Message || "Bank with this name already exists"
            );
            // Keep the form open but clear loading state
            setLoading(false);
            return;
          } else {
            throw err; // rethrow if it's not the specific error we're handling
          }
        }
      }

      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error processing bank:", error);
      toast.error(
        error.response?.data?.Message || "Failed to process bank details"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          {editData ? "Edit Bank Account" : "Add Bank Account"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          {/* Input Fields (Dynamic Rendering for Reusability) */}
          {[
            {
              icon: <FaUniversity />,
              name: "bank_name",
              placeholder: "Bank Name",
            },
            {
              icon: <FaRegCreditCard />,
              name: "account_number",
              placeholder: "Account Number",
            },
            { icon: <FaCode />, name: "ifsc_code", placeholder: "IFSC Code" },
            {
              icon: <FaMoneyBillWave />,
              name: "current_balance",
              placeholder: "Current Balance",
              type: "number",
              step: "0.01",
            },
          ].map(
            (
              { icon, name, placeholder, type = "text", step, disabled },
              index
            ) => (
              <div
                key={index}
                className="mb-4 flex items-center border-b border-gray-300 py-2"
              >
                {icon}
                <input
                  className={`appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none ${
                    disabled
                      ? "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                      : ""
                  }`}
                  type={type}
                  step={step}
                  name={name}
                  placeholder={placeholder}
                  value={formData[name]}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            )
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <button
              className="bg-secondary hover:bg-primary text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              {editData ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>

      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default AddBankForm;
