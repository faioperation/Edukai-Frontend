"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
        style: {
          borderRadius: "12px",
        },
      }}
    />
  );
}

