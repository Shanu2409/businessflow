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

const AddBankForm = ({ setShowAddBankForm, fetchData, editData }) => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  const handleEdit = async (data) => {
    try {
      const response = await axios.put(`/api/banks/${data.bank_name}`, data);
      toast.success(response?.data?.message);
    } catch (error) {
      console.error("Error editing bank:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editData) {
      handleEdit({
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
      });
      setShowAddBankForm(false);
      fetchData();

      return;
    }

    let user = {};
    if (typeof window !== "undefined") {
      user = JSON.parse(sessionStorage.getItem("user"));
    }

    const response = await axios.post("/api/banks", {
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      current_balance: currentBalance,
      created_by: user.username,
    });

    console.log(response.data); // Debugging

    if (response.status !== 200) {
      console.error(response.data.message);
      toast.error(response.data.message);
      return;
    }

    console.log(response.data.message);
    toast.success(response.data.message);

    fetchData();

    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setCurrentBalance("");

    setShowAddBankForm(false);
  };

  useEffect(() => {
    if (editData) {
      setBankName(editData.bank_name);
      setAccountNumber(editData.account_number);
      setIfscCode(editData.ifsc_code);
      setCurrentBalance(editData.current_balance);
    }
  }, [editData]);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">Add Bank Account</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="mb-4 flex items-center border-b border-gray-300 py-2">
          <FaUniversity className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            type="text"
            placeholder="Bank Name"
            disabled={editData}
            aria-label="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>

        <div className="mb-4 flex items-center border-b border-gray-300 py-2">
          <FaRegCreditCard className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            placeholder="Account Number"
            aria-label="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>

        <div className="mb-4 flex items-center border-b border-gray-300 py-2">
          <FaCode className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="IFSC Code"
            aria-label="IFSC Code"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
          />
        </div>

        <div className="mb-6 flex items-center border-b border-gray-300 py-2">
          <FaMoneyBillWave className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            type="number"
            step="0.01"
            placeholder="Current Balance"
            aria-label="Current Balance"
            disabled={editData}
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
          />
        </div>

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
  );
};

export default AddBankForm;
