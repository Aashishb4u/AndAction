"use client";

import React, { useEffect } from "react";

export default function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.classList.add("auth-page");
    return () => {
      document.body.classList.remove("auth-page");
    };
  }, []);

  return <>{children}</>;
}

