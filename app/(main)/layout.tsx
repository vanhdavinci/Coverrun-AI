import React from "react";
import DashboardProvider from "./provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps): React.JSX.Element {
  return (
    <div className=" bg-gray-50">
      <DashboardProvider>
        <div className="w-full mx-auto ">
          {children}
        </div>
      </DashboardProvider>
    </div>
  );
}

export default DashboardLayout;
