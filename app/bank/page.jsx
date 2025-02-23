"use client";

import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import React, { useEffect, useState } from "react";
import { Table } from "@/components/Table";
import axios from "axios";

const Page = () => {
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);

  const fetchBankData = async () => {
    try {
      const { data: responseData } = await axios.get(
        `/api/banks?search=${search}&page=${page}&limit=20`
      );

      setData(responseData?.data);
      setTotalData(responseData?.totalData);
    } catch (error) {
      console.error("Error fetching bank data:", error);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, [search, page]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Toggle Form Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            Bank Details
          </h1>
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
            <AddBankForm
              setShowAddBankForm={setShowAddBankForm}
              fetchData={fetchBankData}
            />
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Table
            setSearch={setSearch}
            fetchData={fetchBankData}
            rows={data}
            totalData={totalData}
            showChecknRecheck={false}
            page={page}
            setPage={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
