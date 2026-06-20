import React, { PropsWithChildren } from "react";
import { colors } from "./colors";

export function ThemeProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export { colors };
