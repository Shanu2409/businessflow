"use client";

import React, { useEffect, useState, Suspense } from "react";
import AddBankForm from "@/components/AddBankForm";
import Navbar from "@/components/Navbar";
import { Table } from "@/components/Table";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import AddUserForm from "@/components/AddUserForm";
import { set } from "lodash";
import FullScreenLoader from "@/components/FullScreenLoader";

const PageContent = () => {
  const searchParams = useSearchParams();
  const [showAddUserForm, setShowAddUserForm] = useState(
    searchParams.get("add") === "true"
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [data, setData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    const searchQuery = searchParams.get("search") || "";

    try {
      const { data: responseData } = await axios.get(
        `/api/users?search=${search || searchQuery}&page=${page}&limit=20`
      );
      setData(responseData?.data);
      setTotalData(responseData?.totalData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }

    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user account?")) {
      try {
        const response = await axios.delete(`/api/users/${id}`);
        toast.success(response?.data?.message);
        fetchUserData();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const fetchWebsiteList = async () => {
    setLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `/api/websites?onlyNames=true`
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("websites", JSON.stringify(responseData?.data));
      }

      console.log(responseData);
    } catch (error) {
      console.error("Error fetching bank data:", error);
    }

    setLoading(false);
  };

  const handleIsEdit = (data) => {
    setEditData(data);
    setShowAddUserForm(true);
  };

  useEffect(() => {
    fetchUserData();
  }, [search, page]);

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Toggle Form Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              User Clients Details
            </h1>
            <button
              className="bg-secondary text-white font-semibold px-6 py-2 rounded transition duration-300 ease-in-out shadow"
              onClick={() => {
                setShowAddUserForm(!showAddUserForm);
                fetchWebsiteList();
                setEditData(null);
              }}
            >
              {showAddUserForm ? "Cancel" : "Add User"}
            </button>
          </div>

          {/* Conditionally Render Add Bank Form */}
          {showAddUserForm && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <AddUserForm
                fetchWebsiteList={fetchWebsiteList}
                editData={editData}
                setShowAddUserForm={setShowAddUserForm}
                fetchData={fetchUserData}
              />
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Table
              setSearch={setSearch}
              fetchData={fetchUserData}
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
      <FullScreenLoader isLoading={loading} />
    </>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Users page...</div>}>
      <PageContent />
    </Suspense>
  );
}
