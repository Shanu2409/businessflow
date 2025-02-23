"use client";

import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import React, { useEffect, useState } from "react";
import { Table } from "@/components/Table";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const [showAddBankForm, setShowAddBankForm] = useState(
    searchParams.get("add") == "true" ? true : false
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);

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

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      try {
        const response = await axios.delete(`/api/banks/${id}`);

        toast.success(response?.data?.message);

        fetchBankData();
      } catch (error) {
        console.error("Error deleting bank:", error);
      }
    }
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowAddBankForm(true);
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
            onClick={() => {
              setShowAddBankForm(!showAddBankForm);
              setEditData(null);
            }}
          >
            {showAddBankForm ? "Cancel" : "Add Bank"}
          </button>
        </div>

        {/* Conditionally Render Add Bank Form */}
        {showAddBankForm && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <AddBankForm
              editData={editData}
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
            handleDelete={handleDelete}
            handleIsEdit={handleIsEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
