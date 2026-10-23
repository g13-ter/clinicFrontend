import type { ReactNode } from "react";
import Layout from "../layout/Layout";

interface PageFrameProps {
  embedded: boolean;
  children: ReactNode;
}

function PageFrame({ embedded, children }: PageFrameProps) {
  return embedded ? <>{children}</> : <Layout>{children}</Layout>;
}

export default PageFrame;
