import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ user, handleLogout }) => {
    const [data, setData] = useState({
        total_orders: 0,
        orders_today: 0,
        urgent_orders: 0,
        avg_confidence: 0,
    });
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/analytics", {
                    credentials: "include",
                    cache: "no-store"
                });
                const result = await response.json();
                console.log("Analytics result:", result); // Debug log
                setData(result);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            }
        };

        // Fetch regardless of user prop for now since we disabled backend auth check
        fetchAnalytics();

        // Poll every 5 seconds
        const interval = setInterval(() => {
            fetchAnalytics();
        }, 5000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="bg-[#fdca5e] font-sans h-screen overflow-hidden">
            <div className="h-full overflow-y-auto no-scrollbar">
                <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="max-w-[95%] mx-auto">
                    {/* FILTER + BUTTON */}
                    <div className="flex justify-end items-center gap-4 mt-6">
                        <select className="border rounded-md px-3 py-2 text-sm focus:outline-none text-gray-900 bg-white">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>This Week</option>
                            <option>Last 7 Days</option>
                        </select>

                        <button
                            onClick={() => navigate("/orders")}
                            className="bg-[#7c5327] text-white px-4 py-2 rounded-md hover:bg-black transition"
                        >
                            View Orders
                        </button>
                    </div>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
                        <div className="bg-white rounded-xl p-5 shadow">
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <h2 className="text-3xl font-bold mt-2 text-gray-900">{data.total_orders}</h2>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow">
                            <p className="text-sm text-gray-500">Orders Today</p>
                            <h2 className="text-3xl font-bold mt-2 text-gray-900">{data.orders_today}</h2>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow">
                            <p className="text-sm text-gray-500">Urgent Orders</p>
                            <h2 className="text-3xl font-bold text-red-600 mt-2">
                                {data.urgent_orders}
                            </h2>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow">
                            <p className="text-sm text-gray-500">Avg Confidence</p>
                            <h2 className="text-3xl font-bold text-green-600 mt-2">
                                {data.avg_confidence}%
                            </h2>
                        </div>
                    </div>

                    {/* CHARTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 mb-10">
                        <div className="bg-white rounded-xl p-5 shadow">
                            <h3 className="font-semibold mb-3 text-gray-900">Orders Over Time</h3>
                            <div className="h-64 flex items-center justify-center text-gray-400 border rounded">
                                Line Chart (Coming Next)
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow">
                            <h3 className="font-semibold mb-3 text-gray-900">Order Status Distribution</h3>
                            <div className="h-64 flex items-center justify-center text-gray-400 border rounded">
                                Pie Chart (Coming Next)
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow md:col-span-2">
                            <h3 className="font-semibold mb-3 text-gray-900">Priority Breakdown</h3>
                            <div className="h-64 flex items-center justify-center text-gray-400 border rounded">
                                Bar Chart (Coming Next)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

export default Dashboard;
