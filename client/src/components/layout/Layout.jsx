import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ currentTab, setCurrentTab, children, onGlobalSearch }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Dark vertical sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-80 min-w-0 transition-all">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          setIsMobileOpen={setIsMobileOpen}
          onGlobalSearch={onGlobalSearch}
        />

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
