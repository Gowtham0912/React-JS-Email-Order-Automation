import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";

const Orders = ({ user, handleLogout }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [autoScan, setAutoScan] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [toast, setToast] = useState(null); // { type: 'no-email' | 'mail-updated', message: '' }
    const [expandedRow, setExpandedRow] = useState(null);

    const API_URL = "http://localhost:5000";

    const fetchOrders = async () => {
        try {
            // console.log("Fetching orders...");
            const res = await fetch(`${API_URL}/api/orders`, {
                credentials: "include",
                cache: "no-store"
            });
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const fetchAutoScanStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/auto-scan-status`, { credentials: "include" });
            const data = await res.json();
            setAutoScan(data.auto_scan);
        } catch (err) {
            console.error("Error fetching auto scan status:", err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchAutoScanStatus();

        // Poll for new orders every 5 seconds
        const interval = setInterval(() => {
            fetchOrders();
            fetchAutoScanStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleScan = async () => {
        setIsLoading(true);
        setToast(null);
        try {
            const res = await fetch(`${API_URL}/scan`, { method: "POST", credentials: "include" });
            const result = await res.json();

            if (result.status === "no_new") {
                setToast({ type: "no-email", message: "No new order emails found." });
            } else if (result.status === "updated") {
                setToast({ type: "mail-updated", message: "Mail data updated successfully!" });
                fetchOrders();
            } else {
                // Handle blocked or unauthorized
                // alert(result.message);
            }
        } catch (err) {
            console.error("Scan error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const toggleAutoScan = async () => {
        const newState = !autoScan;
        setAutoScan(newState);
        try {
            await fetch(`${API_URL}/toggle-auto-scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: newState }),
                credentials: "include",
            });
        } catch (err) {
            console.error("Auto scan toggle error:", err);
            setAutoScan(!newState); // revert
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`${API_URL}/delete/${deleteId}`, { method: "DELETE", credentials: "include" });
            const result = await res.json();
            if (result.success) {
                fetchOrders();
            }
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="font-sans bg-[#fdca5e] text-center m-0 min-h-screen">
            <Navbar user={user} handleLogout={handleLogout} />

            {/* Status Message (Toast) */}
            <div className="relative h-10">
                {toast && (
                    <span className="absolute left-1/2 transform -translate-x-1/2 inline-flex items-center gap-2 font-semibold mt-2 bg-white px-5 py-2 rounded-3xl shadow-lg transition-all duration-500 animate-pop z-50">
                        {toast.type === "no-email" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-[#7c5327]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <span className="text-[#7c5327]">No new order emails found.</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-green-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                </svg>
                                <span className="text-green-700">Mail data updated successfully!</span>
                            </>
                        )}
                    </span>
                )}
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div id="loading-indicator" className="fixed inset-0 flex flex-col items-center justify-center bg-white/50 z-50">
                    <div className="loader"></div>
                    <p className="text-[#7c5327] font-semibold mt-2">Scanning for new emails...</p>
                </div>
            )}

            {/* Controls */}
            <div className="w-[95%] h-12 mx-auto flex justify-between items-center relative mt-6">
                {/* Left: Scan Controls */}
                <div className="flex items-center gap-4">
                    {!autoScan && (
                        <button
                            onClick={handleScan}
                            className="flex items-center gap-2 bg-[#7c5327] hover:bg-black text-white px-6 py-2 rounded-md font-medium transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                            <span>Scan for New Emails</span>
                        </button>
                    )}

                    {/* Automatic Scan Toggle */}
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-sm">
                        <label className="flex items-center cursor-pointer gap-2 text-gray-800 font-medium">
                            <span>Automatic Scan</span>
                            <div
                                className="relative"
                                onClick={toggleAutoScan}
                            >
                                <div className={`w-10 h-5 bg-gray-300 rounded-full transition ${autoScan ? "bg-green-600" : ""}`}></div>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition transform ${autoScan ? "translate-x-5" : "translate-x-0"}`}></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Right: Download Button */}
                <div className="relative flex items-center group">
                    <button className="flex items-center gap-2 bg-[#7c5327] hover:bg-black text-white font-medium px-4 py-2 rounded-md transition">
                        <span>Download</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="hidden group-hover:block absolute right-0 top-10 bg-white shadow-lg rounded-md w-48 text-left border border-gray-200 z-50">
                        <a href={`${API_URL}/export/pdf`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition rounded-md">
                            <img src="/static/Pdf.svg" className="w-5" alt="PDF" /> Download as PDF
                        </a>
                        <a href={`${API_URL}/export/excel`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition rounded-md">
                            <img src="/static/Excel.svg" className="w-5" alt="Excel" /> Download as Excel
                        </a>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="mt-6 w-[95%] mx-auto bg-white rounded-lg shadow-md border border-gray-300 px-3 pt-3 mb-15">
                {/* Header row */}
                <div className="bg-[#7c5327] text-white font-semibold py-3 px-4 rounded-md text-sm sticky top-0 z-10">
                    <div className="flex">
                        <div className="w-1/12">Order ID</div>
                        <div className="w-2/12">Product Name</div>
                        <div className="w-1/12">Quantity</div>
                        <div className="w-2/12">Due Date</div>
                        <div className="w-2/12">Retailer Name</div>
                        <div className="w-2/12">Retailer Email</div>
                        <div className="w-3/12">Retailer Address</div>
                        <div className="w-3/12">Email Subject</div>
                        <div className="w-1/12">Status</div>
                        <div className="w-1/12">Priority</div>
                        <div className="w-1/12">Confidence</div>
                        <div className="w-1/12">Actions</div>
                    </div>
                </div>

                {/* Scrollable Rows */}
                <div className="divide-y divide-gray-200 overflow-y-auto max-h-[60vh] no-scrollbar">
                    {orders.map((order) => (
                        <React.Fragment key={order.id}>
                            <div className="flex items-center py-3 px-4 hover:bg-gray-50 text-sm text-gray-900">
                                <div className="w-1/12">{order.id}</div>
                                <div className="w-2/12">{order.product_name}</div>
                                <div className="w-1/12">{order.quantity_ordered}</div>
                                <div className="w-2/12">{order.delivery_due_date}</div>
                                <div className="w-2/12">{order.retailer_name}</div>
                                <div className="w-2/12">{order.retailer_email}</div>
                                <div className="w-3/12 truncate">{order.retailer_address}</div>
                                <div className="w-3/12 truncate">{order.client_email_subject}</div>

                                {/* Status */}
                                <div className="w-1/12">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${order.order_status === 'Approved' ? 'bg-green-200 text-green-800' :
                                        order.order_status === 'Needs Review' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-red-200 text-red-800'
                                        }`}>
                                        {order.order_status}
                                    </span>
                                </div>

                                {/* Priority */}
                                <div className="w-1/12">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${order.priority_level === 'Urgent' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                                        }`}>
                                        {order.priority_level}
                                    </span>
                                </div>

                                {/* Confidence */}
                                <div className="w-1/12">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${order.confidence_score < 70 ? 'bg-red-200 text-red-800' :
                                        order.confidence_score < 85 ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                        }`}>
                                        {order.confidence_score}%
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="w-1/12 flex gap-2">
                                    <button
                                        onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                                        className="bg-gray-200 hover:bg-gray-300 px-2 rounded"
                                    >
                                        ▼
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(order.id)}
                                        className="bg-[#dc3545] hover:bg-[#b02a37] text-white px-3 py-1 rounded transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedRow === order.id && (
                                <div className="bg-gray-50 px-6 py-4 text-sm text-gray-900">
                                    <div className="grid grid-cols-12 gap-6">
                                        <div className="col-span-4 space-y-2 text-left">
                                            <div><b>Order Number:</b> {order.order_number || '-'}</div>
                                            <div><b>Created At:</b> {order.created_at || '-'}</div>
                                            <div><b>Unit:</b> {order.unit || '-'}</div>
                                            <div><b>Source:</b> {order.source_of_order || '-'}</div>
                                            <div><b>Remarks:</b> {order.remarks || '—'}</div>
                                        </div>
                                        <div className="col-span-8 text-left">
                                            <b>Extracted Text:</b>
                                            <div className="mt-2 p-3 bg-white border rounded max-h-40 overflow-y-auto text-xs whitespace-pre-wrap">
                                                {order.extracted_text || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[350px] text-center">
                        <h3 className="text-lg font-semibold mb-4">Are you sure you want to delete this order?</h3>
                        <button onClick={handleDelete} className="bg-[#7c5327] hover:bg-black text-white px-4 py-2 rounded-md mx-2 font-medium transition">Yes, Delete</button>
                        <button onClick={() => setDeleteId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mx-2 font-medium transition">Cancel</button>
                    </div>
                </div>
            )}

            <style>{`
          .loader {
            width: 50px;
            aspect-ratio: 1;
            display: grid;
            color: #854f1d;
            background: radial-gradient(farthest-side, currentColor calc(100% - 6px), #0000 calc(100% - 5px) 0);
            -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 13px), #000 calc(100% - 12px));
            border-radius: 50%;
            animation: l19 2s infinite linear;
            margin: 10px auto;
          }
          .loader::before,
          .loader::after {
            content: "";
            grid-area: 1/1;
            background:
                linear-gradient(currentColor 0 0) center,
                linear-gradient(currentColor 0 0) center;
            background-size: 100% 10px, 10px 100%;
            background-repeat: no-repeat;
          }
          .loader::after {
            transform: rotate(45deg);
          }
          @keyframes l19 {
            100% { transform: rotate(1turn); }
          }
          
          @keyframes popUp {
            0% { opacity: 0; transform: translate(-50%, 20px) scale(0.8); }
            50% { opacity: 1; transform: translate(-50%, -4px) scale(1.05); }
            100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
          .animate-pop {
            animation: popUp 0.6s ease-out;
          }
          
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

export default Orders;
