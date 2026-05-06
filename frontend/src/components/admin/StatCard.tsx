import React from "react";

const StatCard = ({
  title,
  value,
  subtitle,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  onClick?: () => void;
}) => {
  const clickable = Boolean(onClick);
  return (
    <div
      role={clickable ? "button" : undefined}
      onClick={onClick}
      className={
        "bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-5 shadow-lg shadow-slate-800" +
        (clickable ? " cursor-pointer hover:border-blue-500 hover:shadow-slate-700" : "")
      }
    >
      <p className="text-gray-300 text-sm uppercase tracking-widest">{title}</p>
      <div className="text-3xl font-bold text-white mt-2">{value}</div>
      {subtitle ? (
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      ) : null}
    </div>
  );
};

export default StatCard;
