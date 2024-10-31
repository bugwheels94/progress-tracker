import { ReactNode } from "react";

import classes from "./Button.module.css";
export function Button({
  onClick,
  children,
  className,
  type = "button",
  ...props
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      className={`button ${className} ${classes.button}`}
      type={type}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
