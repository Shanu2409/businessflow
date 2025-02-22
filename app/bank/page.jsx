"use client";

import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import React, { useState } from "react";
import { Table } from "@/components/Table";

const data = [
  {
    id: 1,
    bank_name: "HDFC Bank",
    account_number: "1234567890",
    ifsc_code: "HDFC0001",
    current_balance: 5000,
    created_by: "John Doe",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 2,
    bank_name: "ICICI Bank",
    account_number: "9876543210",
    ifsc_code: "ICICI0002",
    current_balance: 8000,
    created_by: "Jane Smith",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 3,
    bank_name: "SBI Bank",
    account_number: "5555555555",
    ifsc_code: "SBI0003",
    current_balance: 3000,
    created_by: "Alice Johnson",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 4,
    bank_name: "Axis Bank",
    account_number: "1111111111",
    ifsc_code: "AXIS0004",
    current_balance: 6000,
    created_by: "Bob Williams",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 5,
    bank_name: "Kotak Mahindra Bank",
    account_number: "9999999999",
    ifsc_code: "KOTAK0005",
    current_balance: 4000,
    created_by: "Charlie Brown",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 6,
    bank_name: "Canara Bank",
    account_number: "2222222222",
    ifsc_code: "CANARA0006",
    current_balance: 7000,
    created_by: "Emily Davis",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 7,
    bank_name: "Bank of Baroda",
    account_number: "3333333333",
    ifsc_code: "BARODA0007",
    current_balance: 9000,
    created_by: "Michael Wilson",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 8,
    bank_name: "Bank of India",
    account_number: "4444444444",
    ifsc_code: "BANKIND0008",
    current_balance: 2000,
    created_by: "Sarah Johnson",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 9,
    bank_name: "RBL Bank",
    account_number: "5555555555",
    ifsc_code: "RBL0009",
    current_balance: 1000,
    created_by: "Daniel Brown",
    createdAt: "24/09/2003:12-02-42",
  },
  {
    id: 10,
    bank_name: "Sundaram Finance",
    account_number: "6666666666",
    ifsc_code: "SUNDFIN0010",
    current_balance: 500,
    created_by: "Olivia Davis",
    createdAt: "24/09/2003:12-02-42",
  },
];

const Page = () => {
  const [showAddBankForm, setShowAddBankForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto py-8 space-y-6">
        {/* Header & Toggle Form Button */}
        <div className="flex justify-between items-center px-6 py-4 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">Bank Details</h1>
          <button
            className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 ease-in-out shadow"
            onClick={() => setShowAddBankForm(!showAddBankForm)}
          >
            {showAddBankForm ? "Cancel" : "Add Bank"}
          </button>
        </div>

        {/* Conditionally Render Add Bank Form */}
        {showAddBankForm && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <AddBankForm setShowAddBankForm={setShowAddBankForm} />
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Table rows={data} />
        </div>
      </div>
    </div>
  );
};

export default Page;
