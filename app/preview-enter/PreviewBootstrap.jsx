"use client";
import { useEffect } from "react";

export default function PreviewBootstrap() {
  useEffect(() => {
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        username: "PREVIEW",
        type: "admin",
        group: "MAIN_GROUP",
        data_owner: "PREVIEW",
      })
    );
    window.location.replace("/bank");
  }, []);
  return <p style={{ padding: 24 }}>Opening preview...</p>;
}
