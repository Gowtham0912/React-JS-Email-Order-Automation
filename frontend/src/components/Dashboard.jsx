import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
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
    const [chartData, setChartData] = useState({
        orders_over_time: [],
        status_distribution: [],
        priority_breakdown: [],
        top_retailers: [],
        orders_by_day: []
    });
    const [recentActivity, setRecentActivity] = useState([]);

    const PIE_COLORS = ["#d97706", "#f59e0b", "#92400e", "#fbbf24", "#78350f"];
    const BAR_COLORS = ["#d97706", "#f59e0b", "#92400e", "#fbbf24"];
    const RETAILER_COLORS = ["#92400e", "#b45309", "#d97706", "#f59e0b", "#fbbf24"];

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

        const fetchChartData = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/chart-data", {
                    credentials: "include", cache: "no-store"
                });
                const result = await res.json();
                setChartData(result);
            } catch (err) {
                console.error("Chart data error:", err);
            }
        };
        fetchChartData();

        const fetchRecentActivity = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/recent-activity", {
                    credentials: "include", cache: "no-store"
                });
                const result = await res.json();
                setRecentActivity(result);
            } catch (err) {
                console.error("Recent activity error:", err);
            }
        };
        fetchRecentActivity();

        // Poll every 5 seconds
        const interval = setInterval(() => {
            fetchAnalytics();
            fetchChartData();
            fetchRecentActivity();
        }, 5000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="bg-[#fdca5e] font-sans h-screen flex flex-col overflow-hidden">
            <div className="shrink-0">
                <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            <div className="flex-1 min-h-0 flex flex-col max-w-[95%] w-full mx-auto">
                {/* ROWS 1 & 2 — merged layout with tall right-side card */}
                <div className="flex-[1.5] basis-0 min-h-0 flex flex-col md:flex-row gap-3 mt-2">
                    {/* LEFT SIDE — KPI cards (top) + 3 charts (bottom) */}
                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                        {/* KPI CARDS — 4 cards */}
                        <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Total Orders - Circle pattern */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default group">
                                <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                                <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white/5 rounded-full"></div>
                                <div className="absolute top-1/2 right-6 w-8 h-8 bg-white/5 rounded-full"></div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-amber-100 font-medium">Total Orders</p>
                                </div>
                                <h2 className="text-2xl font-bold mt-1 text-white">{data.total_orders}</h2>
                            </div>

                            {/* Orders Today - Diagonal stripe pattern */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default group">
                                <div className="absolute -top-6 -right-6 w-20 h-20 border-4 border-white/10 rounded-full group-hover:rotate-45 transition-transform duration-500"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/5 to-transparent"></div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-amber-100 font-medium">Orders Today</p>
                                </div>
                                <h2 className="text-2xl font-bold mt-1 text-white">{data.orders_today}</h2>
                            </div>

                            {/* Urgent Orders - Diamond pattern */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default group">
                                <div className="absolute -top-4 right-3 w-12 h-12 bg-white/10 rotate-45 group-hover:rotate-90 transition-transform duration-500"></div>
                                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white/5 rotate-45"></div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-amber-100 font-medium">Urgent Orders</p>
                                </div>
                                <h2 className="text-2xl font-bold mt-1 text-white">{data.urgent_orders}</h2>
                            </div>

                            {/* Avg Confidence - Wave/arc pattern */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default group">
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 border-8 border-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="absolute top-0 right-0 w-full h-1/3 bg-gradient-to-b from-white/5 to-transparent"></div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-amber-100 font-medium">Avg Confidence</p>
                                </div>
                                <h2 className="text-2xl font-bold mt-1 text-white">{data.avg_confidence}%</h2>
                            </div>
                        </div>

                        {/* CHARTS — 3 columns */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Bar Chart — Priority Breakdown */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:-translate-y-0.5 flex flex-col min-h-0">
                                <div className="flex items-center gap-2 mb-1 shrink-0">
                                    <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full"></div>
                                    <h3 className="font-semibold text-sm text-gray-900">Priority Breakdown</h3>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.priority_breakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                {chartData.priority_breakdown.map((_, idx) => (
                                                    <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart — Order Status Distribution */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:-translate-y-0.5 flex flex-col min-h-0">
                                <div className="flex items-center gap-2 mb-1 shrink-0">
                                    <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full"></div>
                                    <h3 className="font-semibold text-sm text-gray-900">Order Status Distribution</h3>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData.status_distribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} style={{ fontSize: 11 }}>
                                                {chartData.status_distribution.map((_, idx) => (
                                                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Radar Chart — Orders by Day of Week */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:-translate-y-0.5 flex flex-col min-h-0">
                                <div className="flex items-center gap-2 mb-1 shrink-0">
                                    <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full"></div>
                                    <h3 className="font-semibold text-sm text-gray-900">Orders by Day of Week</h3>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData.orders_by_day || []}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                            <PolarRadiusAxis tick={{ fontSize: 9, fill: "#9ca3af" }} allowDecimals={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Radar name="Orders" dataKey="orders" stroke="#d97706" fill="#d97706" fillOpacity={0.3} strokeWidth={2} dot={{ fill: '#d97706', r: 3 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE — Merged tall card spanning both rows */}
                    <div className="md:w-[200px] shrink-0 relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col min-h-0">
                        {/* Decorative background elements */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
                        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full"></div>
                        <div className="absolute top-1/2 right-2 w-12 h-12 bg-white/5 rounded-full"></div>

                        {/* Live Activity Feed section */}
                        <div className="flex items-center gap-2 mb-2 shrink-0">
                            <div className="w-1 h-4 bg-white/40 rounded-full"></div>
                            <h3 className="font-semibold text-sm text-white">Live Activity</h3>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2">
                            {recentActivity.length > 0 ? recentActivity.map((item, idx) => (
                                <div key={item.id || idx} className="relative bg-white/15 backdrop-blur-sm rounded-lg p-2 hover:bg-white/25 transition-colors duration-200">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1 shrink-0">
                                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-400 animate-pulse' : 'bg-amber-200'}`}></div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-white truncate" title={item.product}>{item.product}</p>
                                            <p className="text-[10px] text-amber-100 truncate" title={item.retailer}>{item.retailer}</p>
                                        </div>
                                        <span className="shrink-0 text-[9px] text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">{item.time_ago}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-amber-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mb-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs">No recent activity</p>
                                </div>
                            )}
                        </div>

                        {/* View Orders button at bottom */}
                        <div className="shrink-0 mt-3">
                            <button
                                onClick={() => navigate("/orders")}
                                className="relative overflow-hidden bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 text-sm w-full font-medium shadow-md hover:shadow-lg group border border-white/20"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                View Orders
                            </button>
                        </div>
                    </div>
                </div>

                {/* CHARTS ROW 3 — 2 columns */}
                <div className="flex-1 basis-0 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 mb-2">
                    {/* Area Chart — Orders Over Time */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:-translate-y-0.5 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-1 shrink-0">
                            <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full"></div>
                            <h3 className="font-semibold text-sm text-gray-900">Orders Over Time</h3>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.orders_over_time} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="orders" stroke="#d97706" strokeWidth={2} fill="url(#colorOrders)" dot={{ fill: '#d97706', r: 3 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Horizontal Bar Chart — Top Retailers */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:-translate-y-0.5 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-1 shrink-0">
                            <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full"></div>
                            <h3 className="font-semibold text-sm text-gray-900">Top Retailers</h3>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.top_retailers} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={70} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="orders" radius={[0, 6, 6, 0]}>
                                        {(chartData.top_retailers || []).map((_, idx) => (
                                            <Cell key={idx} fill={RETAILER_COLORS[idx % RETAILER_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
            <div className="shrink-0">
                <Footer />
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
