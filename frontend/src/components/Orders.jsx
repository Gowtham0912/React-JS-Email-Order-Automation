import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Orders = ({ user, handleLogout }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [autoScan, setAutoScan] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Track if emails are being processed
    const [showProcessingIndicator, setShowProcessingIndicator] = useState(false); // Debounced indicator
    const [deleteId, setDeleteId] = useState(null);
    const [deletedOrderHistory, setDeletedOrderHistory] = useState([]); // Stack for undo
    const [toast, setToast] = useState(null); // { type: 'no-email' | 'mail-updated', message: '' }
    const [expandedRow, setExpandedRow] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("desc");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
    const [showCustomExport, setShowCustomExport] = useState(false);
    const [customExportFields, setCustomExportFields] = useState(new Set(["order_number", "product_name", "quantity_ordered", "delivery_due_date", "retailer_name", "retailer_email", "order_status"]));
    const [customExportFormat, setCustomExportFormat] = useState("excel");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newOrder, setNewOrder] = useState({
        product_name: "",
        quantity: "",
        unit: "pcs",
        due_date: "",
        priority: "Normal",
        retailer_name: "",
        retailer_email: "",
        phone: "",
        address: "",
        remarks: ""
    });

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
            setIsProcessing(data.is_processing || false);
        } catch (err) {
            console.error("Error fetching auto scan status:", err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchAutoScanStatus();

        // Poll for processing status more frequently (every 2 seconds)
        const statusInterval = setInterval(() => {
            fetchAutoScanStatus();
        }, 2000);

        // Poll for orders less frequently (every 5 seconds)
        const ordersInterval = setInterval(() => {
            fetchOrders();
        }, 5000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(ordersInterval);
        };
    }, []);

    // Debounce the processing indicator and show success toast when processing completes
    const wasProcessingRef = React.useRef(false);

    useEffect(() => {
        let timer;
        if (isProcessing) {
            timer = setTimeout(() => {
                setShowProcessingIndicator(true);
                wasProcessingRef.current = true;
            }, 100); // Short delay to avoid race conditions
        } else {
            // If we were processing and now we're not, show success toast
            if (wasProcessingRef.current) {
                setToast({ type: "mail-updated", message: "Mail data updated successfully!" });
                wasProcessingRef.current = false;
            }
            setShowProcessingIndicator(false);
        }
        return () => clearTimeout(timer);
    }, [isProcessing]);

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
                // Save the ID for undo (soft-delete, so we just need the ID to restore)
                setDeletedOrderHistory(prev => [...prev, deleteId]);
                setToast({ type: "deleted", message: "Order moved to trash. Press Ctrl+Z to undo." });
                fetchOrders();
                setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteId); return next; });
            }
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setDeleteId(null);
        }
    };

    // Handle undo (Ctrl+Z) - restores soft-deleted order
    const handleUndo = async () => {
        if (deletedOrderHistory.length === 0) return;

        const lastDeletedId = deletedOrderHistory[deletedOrderHistory.length - 1];

        try {
            const res = await fetch(`${API_URL}/api/trash/restore/${lastDeletedId}`, {
                method: "POST",
                credentials: "include",
            });
            const result = await res.json();
            if (result.success) {
                setDeletedOrderHistory(prev => prev.slice(0, -1)); // Remove from history
                setToast({ type: "restored", message: "Order restored successfully!" });
                fetchOrders();
            }
        } catch (err) {
            console.error("Undo error:", err);
        }
    };

    // Ctrl+Z listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deletedOrderHistory]);

    // Handle adding custom order
    const handleAddOrder = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOrder),
                credentials: "include"
            });
            const result = await res.json();

            if (result.success) {
                setToast({ type: "mail-updated", message: "Order added successfully!" });
                setShowCustomOrderModal(false);
                setNewOrder({
                    product_name: "",
                    quantity: "",
                    unit: "pcs",
                    due_date: "",
                    priority: "Normal",
                    retailer_name: "",
                    retailer_email: "",
                    phone: "",
                    address: "",
                    remarks: ""
                });
                fetchOrders();
            } else {
                setToast({ type: "no-email", message: result.message || "Failed to add order" });
            }
        } catch (err) {
            console.error("Add order error:", err);
            setToast({ type: "no-email", message: "Failed to add order" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="font-sans bg-[#fdca5e] text-center m-0 min-h-screen flex flex-col">
            <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Status Message (Toast) and Processing Indicator - share same position */}
            <div className="relative">
                {toast && (
                    <span className="absolute left-1/2 transform -translate-x-1/2 inline-flex items-center gap-2 font-semibold mt-2 bg-white px-5 py-2 rounded-3xl shadow-lg transition-all duration-500 animate-pop z-50">
                        {toast.type === "no-email" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-[#7c5327]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <span className="text-[#7c5327]">No new order emails found.</span>
                            </>
                        ) : toast.type === "deleted" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-red-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                <span className="text-red-600">{toast.message}</span>
                            </>
                        ) : toast.type === "restored" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-blue-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                </svg>
                                <span className="text-blue-600">{toast.message}</span>
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
                {/* Processing Indicator - shows in same position when no toast */}
                {showProcessingIndicator && !isLoading && !toast && (
                    <span className="absolute left-1/2 transform -translate-x-1/2 inline-flex items-center gap-2 font-semibold mt-2 bg-white px-5 py-2 rounded-3xl shadow-lg transition-all duration-500 animate-pop z-50">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-blue-600">New mail is under processing...</span>
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
            <div className="w-[95%] h-12 mx-auto flex justify-between items-center relative mt-5">
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

                {/* Right: Custom Order + Download Button */}
                <div className="flex items-center gap-3">
                    {/* Custom Order Button - Only for pythonprojectimap@gmail.com */}
                    {user === "pythonprojectimap@gmail.com" && (
                        <button
                            onClick={() => setShowCustomOrderModal(true)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Custom Order</span>
                        </button>
                    )}

                    <div className="relative flex items-center group">
                        <button className="flex items-center gap-2 bg-[#7c5327] hover:bg-black text-white font-medium px-4 py-2 rounded-md transition">
                            <span>{selectedIds.size > 0 ? `Export (${selectedIds.size})` : "Export"}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        <div className="hidden group-hover:block absolute right-0 top-10 bg-white shadow-lg rounded-md w-52 text-left border border-gray-200 z-50">
                            {selectedIds.size > 0 && (
                                <div className="px-3 py-1.5 text-xs text-amber-700 bg-amber-50 rounded-t-md border-b border-amber-200 font-medium">
                                    {selectedIds.size} row(s) selected
                                </div>
                            )}
                            <a href={`${API_URL}/export/pdf${selectedIds.size > 0 ? `?ids=${Array.from(selectedIds).join(",")}` : ""}`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition">
                                <img src="/static/Pdf.svg" className="w-5" alt="PDF" /> Export as PDF
                            </a>
                            <a href={`${API_URL}/export/excel${selectedIds.size > 0 ? `?ids=${Array.from(selectedIds).join(",")}` : ""}`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition">
                                <img src="/static/Excel.svg" className="w-5" alt="Excel" /> Export as Excel
                            </a>
                            <a href={`${API_URL}/export/csv${selectedIds.size > 0 ? `?ids=${Array.from(selectedIds).join(",")}` : ""}`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                Export as CSV
                            </a>
                            <a href={`${API_URL}/export/json${selectedIds.size > 0 ? `?ids=${Array.from(selectedIds).join(",")}` : ""}`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-yellow-600"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
                                Export as JSON
                            </a>
                            <a href={`${API_URL}/export/xml${selectedIds.size > 0 ? `?ids=${Array.from(selectedIds).join(",")}` : ""}`} className="w-full text-gray-700 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-orange-600"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>
                                Export as XML
                            </a>
                            <button
                                onClick={() => setShowCustomExport(true)}
                                className="custom-export-btn w-full px-3 py-2.5 flex items-center gap-2 rounded-b-md text-left relative overflow-hidden"
                            >
                                <span className="custom-export-shimmer"></span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-amber-700 custom-export-icon relative z-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
                                </svg>
                                <span className="relative z-10 font-semibold bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 bg-clip-text text-transparent">Custom Export</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Sort Bar */}
            <div className="w-[95%] mx-auto flex items-center gap-3 mt-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search orders by product, retailer, email, status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5" />
                    </svg>
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                    >
                        <option value="id">Order ID</option>
                        <option value="product_name">Product Name</option>
                        <option value="quantity_ordered">Quantity</option>
                        <option value="delivery_due_date">Due Date</option>
                        <option value="retailer_name">Retailer Name</option>
                        <option value="retailer_email">Retailer Email</option>
                        <option value="order_status">Status</option>
                        <option value="priority_level">Priority</option>
                        <option value="confidence_score">Confidence</option>
                    </select>
                    <button
                        onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                        className="p-1 rounded hover:bg-gray-100 transition text-gray-500"
                        title={sortDirection === "asc" ? "Ascending" : "Descending"}
                    >
                        {sortDirection === "asc" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Results count */}
                {searchQuery && (
                    <span className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-300">
                        {orders.filter(o => {
                            const q = searchQuery.toLowerCase();
                            return (
                                (o.product_name || "").toLowerCase().includes(q) ||
                                (o.retailer_name || "").toLowerCase().includes(q) ||
                                (o.retailer_email || "").toLowerCase().includes(q) ||
                                (o.retailer_address || "").toLowerCase().includes(q) ||
                                (o.client_email_subject || "").toLowerCase().includes(q) ||
                                (o.order_status || "").toLowerCase().includes(q) ||
                                (o.priority_level || "").toLowerCase().includes(q) ||
                                String(o.id).includes(q) ||
                                (o.quantity_ordered || "").toLowerCase().includes(q)
                            );
                        }).length} result(s) found
                    </span>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="w-[95%] mx-auto mt-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {selectedIds.size} order(s) selected
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
                        >Clear Selection</button>
                        <button
                            onClick={() => setShowBulkDeleteConfirm(true)}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="mt-3 w-[95%] mx-auto bg-white rounded-lg shadow-md border border-gray-300 px-3 pt-3 mb-15">
                {/* Header row */}
                <div className="bg-[#7c5327] text-white font-semibold py-3 px-4 rounded-md text-sm sticky top-0 z-10">
                    <div className="flex">
                        <div className="w-[3%] flex items-center">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-amber-400 cursor-pointer"
                                checked={selectedIds.size > 0 && orders.length > 0 && selectedIds.size === orders.length}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedIds(new Set(orders.map(o => o.id)));
                                    } else {
                                        setSelectedIds(new Set());
                                    }
                                }}
                            />
                        </div>
                        <div className="w-[5%]">Order ID</div>
                        <div className="w-[11%]">Product Name</div>
                        <div className="w-[6%]">Quantity</div>
                        <div className="w-[8%]">Due Date</div>
                        <div className="w-[10%]">Retailer Name</div>
                        <div className="w-[12%]">Retailer Email</div>
                        <div className="w-[13%]">Retailer Address</div>
                        <div className="w-[13%]">Email Subject</div>
                        <div className="w-[6%]">Status</div>
                        <div className="w-[5%]">Priority</div>
                        <div className="w-[5%]">Confidence</div>
                        <div className="w-[3%]">Actions</div>
                    </div>
                </div>

                {/* Scrollable Rows */}
                <div className="divide-y divide-gray-200 overflow-y-auto max-h-[49vh] no-scrollbar">
                    {orders
                        .filter(order => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (
                                (order.product_name || "").toLowerCase().includes(q) ||
                                (order.retailer_name || "").toLowerCase().includes(q) ||
                                (order.retailer_email || "").toLowerCase().includes(q) ||
                                (order.retailer_address || "").toLowerCase().includes(q) ||
                                (order.client_email_subject || "").toLowerCase().includes(q) ||
                                (order.order_status || "").toLowerCase().includes(q) ||
                                (order.priority_level || "").toLowerCase().includes(q) ||
                                String(order.id).includes(q) ||
                                (order.quantity_ordered || "").toLowerCase().includes(q)
                            );
                        })
                        .sort((a, b) => {
                            let valA = a[sortField];
                            let valB = b[sortField];
                            // Handle numeric fields
                            if (sortField === "id" || sortField === "confidence_score") {
                                valA = Number(valA) || 0;
                                valB = Number(valB) || 0;
                            } else {
                                valA = String(valA || "").toLowerCase();
                                valB = String(valB || "").toLowerCase();
                            }
                            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
                            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
                            return 0;
                        })
                        .map((order) => (
                            <React.Fragment key={order.id}>
                                <div className={`flex items-center py-3 px-4 hover:bg-gray-50 text-sm text-gray-900 ${selectedIds.has(order.id) ? 'bg-amber-50' : ''}`}>
                                    <div className="w-[3%] flex items-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-amber-500 cursor-pointer"
                                            checked={selectedIds.has(order.id)}
                                            onChange={(e) => {
                                                setSelectedIds(prev => {
                                                    const next = new Set(prev);
                                                    if (e.target.checked) next.add(order.id);
                                                    else next.delete(order.id);
                                                    return next;
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="w-[5%]">{order.id}</div>
                                    <div className="w-[11%] truncate">{order.product_name}</div>
                                    <div className="w-[6%]">{order.quantity_ordered}</div>
                                    <div className="w-[8%]">{order.delivery_due_date}</div>
                                    <div className="w-[10%] truncate">{order.retailer_name}</div>
                                    <div className="w-[12%] truncate">{order.retailer_email}</div>
                                    <div className="w-[13%] truncate">{order.retailer_address}</div>
                                    <div className="w-[13%] truncate">{order.source_of_order === 'Manual' ? <span className="text-gray-500 italic">Manual Entry</span> : order.client_email_subject}</div>

                                    {/* Status */}
                                    <div className="w-[6%]">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${order.order_status === 'Approved' ? 'bg-green-200 text-green-800' :
                                            order.order_status === 'Needs Review' ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-red-200 text-red-800'
                                            }`}>
                                            {order.order_status}
                                        </span>
                                    </div>

                                    {/* Priority */}
                                    <div className="w-[5%]">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${order.priority_level === 'Urgent' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                                            }`}>
                                            {order.priority_level}
                                        </span>
                                    </div>

                                    {/* Confidence */}
                                    <div className="w-[5%]">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${order.confidence_score < 70 ? 'bg-red-200 text-red-800' :
                                            order.confidence_score < 85 ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-green-200 text-green-800'
                                            }`}>
                                            {order.confidence_score}%
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-[3%] flex justify-center">
                                        <button
                                            onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                                            className="bg-gray-200 hover:bg-gray-300 px-2 rounded"
                                        >
                                            ▼
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(order.id)}
                                            className="bg-transparent hover:bg-red-100 p-1.5 rounded transition"
                                            title="Delete Order"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc3545" className="w-5 h-5">
                                                <path d="M5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6zm3 2v10h2V8H8zm6 0v10h2V8h-2zM9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1zm-5 2h16v1H4V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedRow === order.id && (
                                    <div className="bg-gray-50 px-6 py-3 text-sm text-gray-900 border-t border-gray-200">
                                        <div className="grid grid-cols-12 gap-4">
                                            {/* Column 1: Order Details */}
                                            <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                                <h4 className="text-black font-semibold mb-2 text-base">Order Details</h4>
                                                <div className="space-y-1 text-left text-gray-700">
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Order Number:</span>
                                                        <span className="text-black font-medium">{order.order_number || '-'}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Created At:</span>
                                                        <span className="text-black">{order.created_at || '-'}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Processed At:</span>
                                                        <span className="text-black">{order.processed_at || '-'}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Unit:</span>
                                                        <span>{order.unit || '-'}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Source:</span>
                                                        <span className="text-black">{order.source_of_order || '-'}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Remarks:</span>
                                                        <span className={order.remarks && order.remarks.toLowerCase().includes('missing') ? 'text-red-500' : ''}>
                                                            {order.remarks || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Address:</span>
                                                        <span className={order.retailer_address && order.retailer_address.trim() ? "text-black" : "text-gray-400 italic"}>
                                                            {order.retailer_address && order.retailer_address.trim() ? order.retailer_address : 'Not Provided'}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-24 flex-shrink-0">Phone:</span>
                                                        <span className={order.retailer_phone && order.retailer_phone.trim() ? "text-black" : "text-gray-400 italic"}>
                                                            {order.retailer_phone && order.retailer_phone.trim() ? order.retailer_phone : 'Not Provided'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Extracted Email Data */}
                                            <div className="col-span-6 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                                <h4 className="text-black font-semibold mb-2 text-base">Extracted Email Data</h4>
                                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto text-left">
                                                    <pre className="text-xs text-black whitespace-pre-wrap font-mono leading-4">{(order.extracted_text || 'No extracted data available.').trim()}</pre>
                                                </div>
                                            </div>

                                            {/* Column 3: Attachment */}
                                            <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                                <h4 className="text-black font-semibold mb-2 text-base">Attachment</h4>
                                                <div className="flex flex-col items-center justify-center h-28">
                                                    {order.attachment_path ? (
                                                        <a
                                                            href={`${API_URL}/attachments/${order.attachment_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex flex-col items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mb-2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                            </svg>
                                                            <span className="text-sm font-medium">View File</span>
                                                        </a>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mb-2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                            </svg>
                                                            <span className="text-sm">No Attachment</span>
                                                        </div>
                                                    )}
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
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[380px] text-center">
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-amber-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Move to Trash?</h3>
                        <p className="text-sm text-gray-500 mb-4">This order will be moved to Trash and stored for <strong>30 days</strong>. You can restore it anytime from the Trash page.</p>
                        <button onClick={handleDelete} className="bg-[#7c5327] hover:bg-black text-white px-4 py-2 rounded-md mx-2 font-medium transition">Yes, Move to Trash</button>
                        <button onClick={() => setDeleteId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mx-2 font-medium transition">Cancel</button>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[400px] text-center">
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-amber-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Move {selectedIds.size} order(s) to Trash?</h3>
                        <p className="text-sm text-gray-500 mb-4">Selected orders will be moved to Trash and stored for <strong>30 days</strong>. You can restore them anytime from the Trash page.</p>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${API_URL}/api/bulk-delete`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ ids: Array.from(selectedIds) }),
                                        credentials: "include",
                                    });
                                    const result = await res.json();
                                    if (result.success) {
                                        setToast({ type: "deleted", message: result.message });
                                        setDeletedOrderHistory(prev => [...prev, ...Array.from(selectedIds)]);
                                        setSelectedIds(new Set());
                                        fetchOrders();
                                    }
                                } catch (err) { console.error("Bulk delete error:", err); }
                                setShowBulkDeleteConfirm(false);
                            }}
                            className="bg-[#7c5327] hover:bg-black text-white px-4 py-2 rounded-md mx-2 font-medium transition"
                        >Yes, Move to Trash</button>
                        <button onClick={() => setShowBulkDeleteConfirm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mx-2 font-medium transition">Cancel</button>
                    </div>
                </div>
            )}

            {/* Custom Order Modal */}
            {showCustomOrderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-5 w-[520px]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-200">
                            <h3 className="text-lg font-bold text-[#7c5327]">Add Custom Order</h3>
                            <button
                                onClick={() => setShowCustomOrderModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Product Details Row */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-[#7c5327] mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    value={newOrder.product_name}
                                    onChange={(e) => setNewOrder({ ...newOrder, product_name: e.target.value })}
                                    className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                                    placeholder="Enter product name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#7c5327] mb-1">Priority</label>
                                <select
                                    value={newOrder.priority}
                                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                                    className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white"
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Quantity, Unit, Due Date Row */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#7c5327] mb-1">Quantity *</label>
                                <input
                                    type="text"
                                    value={newOrder.quantity}
                                    onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                                    className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                                    placeholder="Qty"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#7c5327] mb-1">Unit</label>
                                <input
                                    type="text"
                                    value={newOrder.unit}
                                    onChange={(e) => setNewOrder({ ...newOrder, unit: e.target.value })}
                                    className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                                    placeholder="pcs, kg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#7c5327] mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    value={newOrder.due_date}
                                    onChange={(e) => setNewOrder({ ...newOrder, due_date: e.target.value })}
                                    className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                                />
                            </div>
                        </div>

                        {/* Retailer Section */}
                        <div className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">
                            <h4 className="text-xs font-bold text-[#7c5327] mb-2 uppercase tracking-wide">Retailer Details</h4>

                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div>
                                    <label className="block text-xs font-semibold text-[#7c5327] mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={newOrder.retailer_name}
                                        onChange={(e) => setNewOrder({ ...newOrder, retailer_name: e.target.value })}
                                        className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white"
                                        placeholder="Retailer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#7c5327] mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={newOrder.retailer_email}
                                        onChange={(e) => setNewOrder({ ...newOrder, retailer_email: e.target.value })}
                                        className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white"
                                        placeholder="Email address"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#7c5327] mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={newOrder.phone}
                                        onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                                        className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white"
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#7c5327] mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={newOrder.address}
                                        onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                                        className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white"
                                        placeholder="Address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[#7c5327] mb-1">Remarks</label>
                            <textarea
                                value={newOrder.remarks}
                                onChange={(e) => setNewOrder({ ...newOrder, remarks: e.target.value })}
                                className="w-full border border-amber-300 rounded px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none h-14 resize-none"
                                placeholder="Optional notes..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowCustomOrderModal(false)}
                                className="px-4 py-2 text-[#7c5327] bg-amber-100 hover:bg-amber-200 rounded-md font-medium text-sm transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddOrder}
                                disabled={isSubmitting || !newOrder.product_name || !newOrder.quantity || !newOrder.due_date || !newOrder.retailer_name || !newOrder.retailer_email}
                                className="px-5 py-2 bg-[#7c5327] hover:bg-[#5c3d1a] text-white rounded-md font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Saving..." : "Save Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Export Modal */}
            {showCustomExport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-5 w-[520px]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-200">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-[#7c5327]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                                </svg>
                                <h3 className="text-lg font-bold text-[#7c5327]">Custom Export</h3>
                            </div>
                            <button
                                onClick={() => setShowCustomExport(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-3">Select the fields you want to include in your export:</p>

                        {/* Select All / Clear */}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setCustomExportFields(new Set([
                                    "order_number", "product_name", "quantity_ordered", "unit", "delivery_due_date",
                                    "retailer_name", "retailer_email", "retailer_address", "retailer_phone",
                                    "order_status", "priority_level", "confidence_score", "source_of_order",
                                    "remarks", "created_at", "processed_at", "client_email_subject"
                                ]))}
                                className="text-xs text-[#7c5327] hover:underline font-medium"
                            >Select All</button>
                            <span className="text-gray-300">|</span>
                            <button
                                onClick={() => setCustomExportFields(new Set())}
                                className="text-xs text-gray-500 hover:underline font-medium"
                            >Clear All</button>
                        </div>

                        {/* Field Checkboxes */}
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-4">
                            {[
                                { key: "order_number", label: "Order Number" },
                                { key: "product_name", label: "Product Name" },
                                { key: "quantity_ordered", label: "Quantity" },
                                { key: "unit", label: "Unit" },
                                { key: "delivery_due_date", label: "Due Date" },
                                { key: "retailer_name", label: "Retailer Name" },
                                { key: "retailer_email", label: "Retailer Email" },
                                { key: "retailer_address", label: "Address" },
                                { key: "retailer_phone", label: "Phone" },
                                { key: "order_status", label: "Status" },
                                { key: "priority_level", label: "Priority" },
                                { key: "confidence_score", label: "Confidence" },
                                { key: "source_of_order", label: "Source" },
                                { key: "remarks", label: "Remarks" },
                                { key: "created_at", label: "Created At" },
                                { key: "processed_at", label: "Processed At" },
                                { key: "client_email_subject", label: "Email Subject" },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={customExportFields.has(key)}
                                        onChange={(e) => {
                                            setCustomExportFields(prev => {
                                                const next = new Set(prev);
                                                if (e.target.checked) next.add(key);
                                                else next.delete(key);
                                                return next;
                                            });
                                        }}
                                        className="w-4 h-4 accent-[#7c5327] cursor-pointer"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>

                        {/* Format Selection */}
                        <div className="flex items-center gap-4 mb-4 pt-3 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-700">Format:</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="excel"
                                    checked={customExportFormat === "excel"}
                                    onChange={() => setCustomExportFormat("excel")}
                                    className="accent-[#7c5327]"
                                />
                                <img src="/static/Excel.svg" className="w-4" alt="Excel" />
                                <span className="text-sm text-gray-700">Excel</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="pdf"
                                    checked={customExportFormat === "pdf"}
                                    onChange={() => setCustomExportFormat("pdf")}
                                    className="accent-[#7c5327]"
                                />
                                <img src="/static/Pdf.svg" className="w-4" alt="PDF" />
                                <span className="text-sm text-gray-700">PDF</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="csv"
                                    checked={customExportFormat === "csv"}
                                    onChange={() => setCustomExportFormat("csv")}
                                    className="accent-[#7c5327]"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                <span className="text-sm text-gray-700">CSV</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="json"
                                    checked={customExportFormat === "json"}
                                    onChange={() => setCustomExportFormat("json")}
                                    className="accent-[#7c5327]"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-yellow-600"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
                                <span className="text-sm text-gray-700">JSON</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="xml"
                                    checked={customExportFormat === "xml"}
                                    onChange={() => setCustomExportFormat("xml")}
                                    className="accent-[#7c5327]"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-orange-600"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>
                                <span className="text-sm text-gray-700">XML</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-400">{customExportFields.size} field(s) selected</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCustomExport(false)}
                                    className="px-4 py-2 text-[#7c5327] bg-amber-100 hover:bg-amber-200 rounded-md font-medium text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={customExportFields.size === 0}
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`${API_URL}/export/custom`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    fields: Array.from(customExportFields),
                                                    format: customExportFormat,
                                                    ...(selectedIds.size > 0 && { ids: Array.from(selectedIds) })
                                                }),
                                                credentials: "include"
                                            });
                                            const blob = await res.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `ERP_Orders_Custom.${({ pdf: "pdf", excel: "xlsx", csv: "csv", json: "json", xml: "xml" })[customExportFormat] || "xlsx"}`;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            window.URL.revokeObjectURL(url);
                                            setShowCustomExport(false);
                                            setToast({ type: "mail-updated", message: "Custom export downloaded!" });
                                        } catch (err) {
                                            console.error("Custom export error:", err);
                                            setToast({ type: "no-email", message: "Export failed" });
                                        }
                                    }}
                                    className="px-5 py-2 bg-[#7c5327] hover:bg-[#5c3d1a] text-white rounded-md font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
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
            0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.8); }
            50% { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.05); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          .animate-pop {
            animation: popUp 0.6s ease-out;
          }
          
          @keyframes processingPop {
            0% { opacity: 0; transform: translateY(20px) scale(0.8); }
            50% { opacity: 1; transform: translateY(-4px) scale(1.05); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-processing {
            animation: processingPop 0.6s ease-out;
          }

          /* Custom Export Button Animation */
          .custom-export-btn {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #fde68a 100%);
            border-top: 1px solid #f59e0b;
            transition: all 0.3s ease;
            animation: customExportGlow 2.5s ease-in-out infinite;
          }
          .custom-export-btn:hover {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fbbf24 100%);
            transform: scale(1.02);
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);
          }
          @keyframes customExportGlow {
            0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.15); }
            50% { box-shadow: 0 0 14px rgba(245, 158, 11, 0.35), 0 0 4px rgba(251, 191, 36, 0.2); }
          }
          .custom-export-shimmer {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
            animation: shimmerSweep 3s ease-in-out infinite;
            z-index: 5;
            pointer-events: none;
          }
          @keyframes shimmerSweep {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
          }
          .custom-export-icon {
            animation: sparkleRotate 3s ease-in-out infinite;
          }
          @keyframes sparkleRotate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(8deg); }
            50% { transform: scale(1) rotate(0deg); }
            75% { transform: scale(1.15) rotate(-8deg); }
          }
          .custom-export-badge {
            animation: badgePulse 2s ease-in-out infinite;
          }
          @keyframes badgePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
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
