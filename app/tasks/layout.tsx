import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-1/3 h-full flex justify-center items-center">
      {children}
    </div>
  );
};

export default Layout;
