import React from "react";
import { ClipLoader } from "react-spinners";

const FullScreenLoader = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <ClipLoader color="#ffffff" size={80} />
    </div>
  );
};

export default FullScreenLoader;
