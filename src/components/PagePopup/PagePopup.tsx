import { ReactNode } from "react";
import classes from "./PagePopup.module.css";
export function PagePopup({
  children,
  actions,
  footer,
}: {
  children: ReactNode;
  actions: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={`${classes.popup}`}>
      <div className={classes.bodyContainer}>
        <div>{children}</div>
        <div className={`${classes.actions}`}>{actions}</div>
      </div>
      {footer && <div className={`${classes.footer}`}>{footer}</div>}
    </div>
  );
}
