import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Analytics = ({ user, handleLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="bg-[#fdca5e] font-sans min-h-screen flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="max-w-[95%] mx-auto mt-10">
                    <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                        <h2 className="text-3xl font-bold text-[#7c5327] mb-4">Analytics Dashboard</h2>
                        <p className="text-gray-700 text-lg mb-8">
                            Detailed insights and reports are coming soon!
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
                                <span className="text-gray-400 font-medium">Sales Trends Chart (Mockup)</span>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
                                <span className="text-gray-400 font-medium">Order Volume Heatmap (Mockup)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
        </div>
    );
};

export default Analytics;
