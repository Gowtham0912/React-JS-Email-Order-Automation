import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Trash = ({ user, handleLogout }) => {
    const [trashOrders, setTrashOrders] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [selectedTrashIds, setSelectedTrashIds] = useState(new Set());

    const API_URL = "http://localhost:5000";

    const fetchTrash = async () => {
        try {
            const res = await fetch(`${API_URL}/api/trash`, { credentials: "include" });
            const data = await res.json();
            setTrashOrders(data);
        } catch (err) {
            console.error("Error fetching trash:", err);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleRestore = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/trash/restore/${id}`, {
                method: "POST",
                credentials: "include",
            });
            const result = await res.json();
            if (result.success) {
                setToast({ type: "success", message: "Order restored successfully!" });
                setSelectedTrashIds(prev => { const next = new Set(prev); next.delete(id); return next; });
                fetchTrash();
            }
        } catch (err) {
            console.error("Restore error:", err);
        }
    };

    const handlePermanentDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            const res = await fetch(`${API_URL}/api/trash/${confirmDeleteId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const result = await res.json();
            if (result.success) {
                setToast({ type: "deleted", message: "Order permanently deleted." });
                setSelectedTrashIds(prev => { const next = new Set(prev); next.delete(confirmDeleteId); return next; });
                fetchTrash();
            }
        } catch (err) {
            console.error("Permanent delete error:", err);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="font-sans bg-[#fdca5e] text-center m-0 min-h-screen flex flex-col">
            <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Toast */}
            {toast && (
                <div className="relative">
                    <span className="absolute left-1/2 transform -translate-x-1/2 inline-flex items-center gap-2 font-semibold mt-2 bg-white px-5 py-2 rounded-3xl shadow-lg z-50 animate-pop">
                        {toast.type === "success" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-green-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span className="text-green-700">{toast.message}</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-red-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                <span className="text-red-600">{toast.message}</span>
                            </>
                        )}
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="w-[95%] mx-auto mt-6 mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    <h2 className="text-lg font-bold text-gray-800">Trash</h2>
                    <span className="text-sm text-gray-500 ml-2">({trashOrders.length} items)</span>
                </div>
                <p className="text-sm text-gray-700 bg-white/60 px-4 py-2 rounded-lg">
                    Deleted orders are kept for <strong>30 days</strong> before being permanently removed.
                </p>
            </div>

            {/* Bulk Action Bar */}
            {selectedTrashIds.size > 0 && (
                <div className="w-[95%] mx-auto mt-3 bg-red-50 border border-red-300 rounded-lg px-4 py-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-red-800 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {selectedTrashIds.size} item(s) selected
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedTrashIds(new Set())}
                            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
                        >Clear</button>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${API_URL}/api/trash/bulk-restore`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ ids: Array.from(selectedTrashIds) }),
                                        credentials: "include",
                                    });
                                    const result = await res.json();
                                    if (result.success) {
                                        setToast({ type: "success", message: result.message });
                                        setSelectedTrashIds(new Set());
                                        fetchTrash();
                                    }
                                } catch (err) { console.error("Bulk restore error:", err); }
                            }}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                            </svg>
                            Restore Selected
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${API_URL}/api/trash/bulk-delete`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ ids: Array.from(selectedTrashIds) }),
                                        credentials: "include",
                                    });
                                    const result = await res.json();
                                    if (result.success) {
                                        setToast({ type: "deleted", message: result.message });
                                        setSelectedTrashIds(new Set());
                                        fetchTrash();
                                    }
                                } catch (err) { console.error("Bulk permanent delete error:", err); }
                            }}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Delete Forever
                        </button>
                    </div>
                </div>
            )}

            {/* Trash Table */}
            <div className="w-[95%] mx-auto mt-3 bg-white rounded-lg shadow-md border border-gray-300 px-3 pt-3 mb-15">
                {/* Header row */}
                <div className="bg-red-700 text-white font-semibold py-3 px-4 rounded-md text-sm">
                    <div className="flex">
                        <div className="w-[3%] flex items-center">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-red-400 cursor-pointer"
                                checked={selectedTrashIds.size > 0 && trashOrders.length > 0 && selectedTrashIds.size === trashOrders.length}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedTrashIds(new Set(trashOrders.map(o => o.id)));
                                    } else {
                                        setSelectedTrashIds(new Set());
                                    }
                                }}
                            />
                        </div>
                        <div className="w-[5%]">ID</div>
                        <div className="w-[16%]">Product Name</div>
                        <div className="w-[7%]">Quantity</div>
                        <div className="w-[9%]">Due Date</div>
                        <div className="w-[13%]">Retailer</div>
                        <div className="w-[13%]">Email</div>
                        <div className="w-[8%]">Status</div>
                        <div className="w-[9%]">Deleted</div>
                        <div className="w-[5%]">Days Left</div>
                        <div className="w-[8%] text-center">Actions</div>
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-200 overflow-y-auto max-h-[60vh] no-scrollbar">
                    {trashOrders.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            <p className="text-gray-400 text-lg font-medium">Trash is empty</p>
                            <p className="text-gray-400 text-sm mt-1">Deleted orders will appear here</p>
                        </div>
                    ) : (
                        trashOrders.map((order) => (
                            <div key={order.id} className={`flex items-center py-3 px-4 hover:bg-red-50 text-sm text-gray-900 transition ${selectedTrashIds.has(order.id) ? 'bg-red-50' : ''}`}>
                                <div className="w-[3%] flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-red-500 cursor-pointer"
                                        checked={selectedTrashIds.has(order.id)}
                                        onChange={(e) => {
                                            setSelectedTrashIds(prev => {
                                                const next = new Set(prev);
                                                if (e.target.checked) next.add(order.id);
                                                else next.delete(order.id);
                                                return next;
                                            });
                                        }}
                                    />
                                </div>
                                <div className="w-[5%]">{order.id}</div>
                                <div className="w-[16%] truncate">{order.product_name}</div>
                                <div className="w-[7%]">{order.quantity_ordered}</div>
                                <div className="w-[9%]">{order.delivery_due_date}</div>
                                <div className="w-[13%] truncate">{order.retailer_name}</div>
                                <div className="w-[13%] truncate">{order.retailer_email}</div>
                                <div className="w-[8%]">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${order.order_status === 'Approved' ? 'bg-green-200 text-green-800' :
                                        order.order_status === 'Needs Review' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-red-200 text-red-800'
                                        }`}>
                                        {order.order_status}
                                    </span>
                                </div>
                                <div className="w-[10%] text-xs text-gray-500">
                                    {order.deleted_at ? new Date(order.deleted_at).toLocaleDateString() : "-"}
                                </div>
                                <div className="w-[5%]">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.days_remaining <= 5 ? 'bg-red-100 text-red-700' :
                                        order.days_remaining <= 15 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {order.days_remaining}d
                                    </span>
                                </div>
                                <div className="w-[8%] flex justify-center gap-1">
                                    {/* Restore */}
                                    <button
                                        onClick={() => handleRestore(order.id)}
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1"
                                        title="Restore Order"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                        </svg>
                                        Restore
                                    </button>
                                    {/* Permanent Delete */}
                                    <button
                                        onClick={() => setConfirmDeleteId(order.id)}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1.5 rounded-md text-xs font-medium transition"
                                        title="Permanently Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Permanent Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[380px] text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-red-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Permanently Delete?</h3>
                        <p className="text-sm text-gray-500 mb-4">This action cannot be undone. The order will be permanently removed.</p>
                        <button onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mx-2 font-medium transition">Yes, Delete Forever</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mx-2 font-medium transition">Cancel</button>
                    </div>
                </div>
            )}

            <Footer />
            <style>{`
                @keyframes popUp {
                    0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.8); }
                    50% { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.05); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                .animate-pop {
                    animation: popUp 0.6s ease-out;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Trash;
