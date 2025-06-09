"use client";

interface props {
  clickHandler: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  darkMode: boolean;
}

export function PrimaryButton({ clickHandler, children, darkMode }: props) {
  const buttonClass = darkMode
    ? "bg-[#3B82F6] text-[#FFFFFF] hover:bg-[#2563EB]"
    : "bg-[#3B82F6] text-[#FFFFFF] hover:bg-[#2563EB]";

  return (
    <button
      className={`py-4 px-4 rounded-md transition-all shadow-[0_2px_10px_rgba(0,0,0,0.05)] 
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]  ${buttonClass}`}
      onClick={clickHandler}
    >
      {children}
    </button>
  );
}
