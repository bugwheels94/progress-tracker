import { ReactNode } from "react";
import classes from "./PagePopup.module.css";
export function PagePopup({
  children,
  actions,
}: {
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className={`${classes.popup}`}>
      <div>{children}</div>
      <div className={`${classes.actions}`}>{actions}</div>
    </div>
  );
}
