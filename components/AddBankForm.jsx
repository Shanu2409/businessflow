"use client";

import UserContext from "@/lib/UserContext";
import axios from "axios";
import { set } from "mongoose";
import React, { useState } from "react";
import {
  FaUniversity,
  FaRegCreditCard,
  FaCode,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-toastify";

const AddBankForm = ({ setShowAddBankForm }) => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(sessionStorage.getItem("user"));

    const response = await axios.post("/api/bank", {
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      current_balance: currentBalance,
      created_by: user.username,
    });

    console.log(response.data); // Debugging

    if (response.status !== 200) {
      toast(response.data.message, { type: "error" });
      return;
    }

    toast(response.data.message, { type: "success" });

    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setCurrentBalance("");

    setShowAddBankForm(false);
  };

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
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="text"
            placeholder="Bank Name"
            aria-label="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>

        <div className="mb-4 flex items-center border-b border-gray-300 py-2">
          <FaRegCreditCard className="text-gray-600 mr-3" />
          <input
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="number"
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
            className="appearance-none bg-transparent border-none w-full text-gray-700 py-1 px-2 leading-tight focus:outline-none"
            type="number"
            step="0.01"
            placeholder="Current Balance"
            aria-label="Current Balance"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center">
          <button
            className="bg-secondary hover:bg-primary text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Add Bank Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBankForm;
