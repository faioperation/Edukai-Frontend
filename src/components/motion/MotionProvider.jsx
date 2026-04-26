"use client";

import { MotionConfig } from "framer-motion";

export default function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: "easeOut" }}>
      {children}
    </MotionConfig>
  );
}

