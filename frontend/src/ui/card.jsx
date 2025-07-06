import React from "react";
export function Card({ children, className, ...props }) { 
  return <div className={["p-4 bg-white rounded-2xl shadow-lg","dark:bg-[#1e293b]",className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}
export function CardContent({ children, className, ...props }) {
  return <div className={["p-2",className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}
