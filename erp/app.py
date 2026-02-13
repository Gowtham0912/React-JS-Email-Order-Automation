import sys, os, imaplib, io, threading, time, json
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
import pandas as pd
from fpdf import FPDF
from flask import Flask, jsonify, request, session, send_file, send_from_directory
from flask_cors import CORS

# ---------------- PATH SETUP ----------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from services.order_service import process_emails
from erp.models import session as db_session, PurchaseOrder

app = Flask(__name__)
app.secret_key = "super_secret_key_123"  # change in production
app.secret_key = "super_secret_key_123"  # change in production
CORS(app, supports_credentials=True, origins=["http://localhost:5173"]) # Enable CORS for React frontend

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# ---------------- AUTO SCAN STATE ----------------
auto_scan_enabled = False
auto_scan_thread = None
is_processing = False  # Flag to track when emails are being processed
AUTO_SCAN_INTERVAL = 10 


# ---------------- AUTO SCAN WORKER ----------------
def auto_scan_worker(email_user, email_pass):
    global auto_scan_enabled, is_processing
    
    def set_processing():
        global is_processing
        is_processing = True
    
    while auto_scan_enabled:
        print("🔄 Automatic scan running...")
        try:
            # Pass callback - is_processing will only be set if emails are actually found
            added = process_emails(email_user, email_pass, on_processing_start=set_processing)
            if added > 0:
                print(f"✅ Processed {added} new order(s)")
                # Keep indicator visible for at least 3 seconds so frontend can catch it
                time.sleep(3)
            else:
                print("📭 No new emails found")
        except Exception as e:
            print(f"Auto scan error: {e}")
        finally:
            is_processing = False
        time.sleep(AUTO_SCAN_INTERVAL)


# ---------------- LOGIN (API) ----------------
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email_user = data.get("email", "").strip()
        email_pass = data.get("password", "").strip()

        if not email_user or not email_pass:
            return jsonify({"success": False, "error": "⚠️ Both fields are required!"})

        # Test IMAP connection
        imap = imaplib.IMAP4_SSL("imap.gmail.com")
        imap.login(email_user, email_pass)
        imap.logout()

        session["email_user"] = email_user
        session["email_pass"] = email_pass
        return jsonify({"success": True})

    except imaplib.IMAP4.error:
        return jsonify({"success": False, "error": "❌ Invalid email or app password."})
    except Exception as e:
        return jsonify({"success": False, "error": f"⚠️ Gmail error: {e}"})


@app.route("/logout")
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})


# ---------------- ANALYTICS API ----------------
@app.route("/api/analytics")
def analytics_data():
    if "email_user" not in session:
         # For logic sake, if we want to protect it:
         # return jsonify({"error": "Unauthorized"}), 401
         # But to keep it simple and avoid 401 handling complexity in frontend if not ready:
         pass # Or just return empty or 0s. 
         # The original returned jsonify({}) if not logged in.
    
    # if "email_user" not in session:
    #     return jsonify({})

    print("DEBUG: Analytics Endpoint Hit")
    orders = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None).all()
    print(f"DEBUG: Analyics Found {len(orders)} orders")

    total_orders = len(orders)
    today = date.today()

    orders_today = sum(
        1 for o in orders
        if o.created_at and o.created_at.date() == today
    )

    urgent_orders = sum(
        1 for o in orders
        if o.priority_level == "Urgent"
    )

    confidence_values = [
        o.confidence_score for o in orders
        if o.confidence_score is not None
    ]

    avg_confidence = (
        sum(confidence_values) / len(confidence_values)
        if confidence_values else 0
    )

    return jsonify({
        "total_orders": total_orders,
        "orders_today": orders_today,
        "urgent_orders": urgent_orders,
        "avg_confidence": round(avg_confidence, 1)
    })


# ---------------- CHART DATA API ----------------
@app.route("/api/chart-data")
def chart_data():
    orders = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None).all()

    # 1. Orders over time (last 7 days)
    today = date.today()
    orders_over_time = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = sum(1 for o in orders if o.created_at and o.created_at.date() == d)
        orders_over_time.append({
            "date": d.strftime("%b %d"),
            "orders": count
        })

    # 2. Order status distribution
    status_counts = {}
    for o in orders:
        status = o.order_status or "Unknown"
        status_counts[status] = status_counts.get(status, 0) + 1
    status_distribution = [{"name": k, "value": v} for k, v in status_counts.items()]

    # 3. Priority breakdown
    priority_counts = {}
    for o in orders:
        priority = o.priority_level or "Normal"
        priority_counts[priority] = priority_counts.get(priority, 0) + 1
    priority_breakdown = [{"name": k, "count": v} for k, v in priority_counts.items()]

    # 4. Top retailers (top 5 by order count)
    retailer_counts = {}
    for o in orders:
        name = o.retailer_name or "Unknown"
        retailer_counts[name] = retailer_counts.get(name, 0) + 1
    top_retailers = sorted(
        [{"name": k, "orders": v} for k, v in retailer_counts.items()],
        key=lambda x: x["orders"], reverse=True
    )[:5]

    # 5. Orders by day of week
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_counts = {d: 0 for d in day_names}
    for o in orders:
        if o.created_at:
            day_name = day_names[o.created_at.weekday()]
            day_counts[day_name] += 1
    orders_by_day = [{"day": d, "orders": day_counts[d]} for d in day_names]

    return jsonify({
        "orders_over_time": orders_over_time,
        "status_distribution": status_distribution,
        "priority_breakdown": priority_breakdown,
        "top_retailers": top_retailers,
        "orders_by_day": orders_by_day
    })


# ---------------- RECENT ACTIVITY API ----------------
@app.route("/api/recent-activity")
def recent_activity():
    orders = db_session.query(PurchaseOrder).filter(
        PurchaseOrder.deleted_at.is_(None)
    ).order_by(PurchaseOrder.created_at.desc()).limit(8).all()

    now = datetime.utcnow()
    activities = []
    for o in orders:
        # Calculate time ago
        if o.created_at:
            diff = now - o.created_at
            seconds = int(diff.total_seconds())
            if seconds < 60:
                time_ago = "just now"
            elif seconds < 3600:
                mins = seconds // 60
                time_ago = f"{mins}m ago"
            elif seconds < 86400:
                hours = seconds // 3600
                time_ago = f"{hours}h ago"
            else:
                days = seconds // 86400
                time_ago = f"{days}d ago"
        else:
            time_ago = "unknown"

        activities.append({
            "id": o.id,
            "retailer": o.retailer_name or "Unknown",
            "product": o.product_name or "N/A",
            "priority": o.priority_level or "Normal",
            "source": o.source_of_order or "Email",
            "time_ago": time_ago
        })

    return jsonify(activities)


# ---------------- MANUAL SCAN ----------------
@app.route("/scan", methods=["POST"])
def scan_emails():
    global auto_scan_enabled

    if "email_user" not in session:
        return jsonify({"status": "unauthorized", "message": "Login required"}), 401

    if auto_scan_enabled:
        return jsonify({
            "status": "blocked",
            "message": "Automatic scan is running. Disable it to use manual scan."
        })

    added = process_emails(
        session["email_user"],
        session["email_pass"]
    )

    if added == 0:
        return jsonify({"status": "no_new", "message": "⚠️ No new order emails found."})

    return jsonify({
        "status": "updated",
        "message": f"✅ {added} new order(s) processed successfully!"
    })


# ---------------- AUTO SCAN TOGGLE ----------------
@app.route("/toggle-auto-scan", methods=["POST"])
def toggle_auto_scan():
    global auto_scan_enabled, auto_scan_thread

    if "email_user" not in session:
        return jsonify({"status": "unauthorized"}), 401

    enabled = request.json.get("enabled", False)
    auto_scan_enabled = enabled

    if enabled:
        if auto_scan_thread is None or not auto_scan_thread.is_alive():
            auto_scan_thread = threading.Thread(
                target=auto_scan_worker,
                args=(session["email_user"], session["email_pass"]),
                daemon=True
            )
            auto_scan_thread.start()

    return jsonify({"auto_scan": auto_scan_enabled})


@app.route("/auto-scan-status")
def auto_scan_status():
    return jsonify({"auto_scan": auto_scan_enabled, "is_processing": is_processing})


# ---------------- DELETE ORDER (SOFT DELETE) ----------------
@app.route("/delete/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    order = db_session.query(PurchaseOrder).get(order_id)
    if order:
        order.deleted_at = datetime.utcnow()
        db_session.commit()
        return jsonify({"success": True, "message": "Order moved to trash"})

    return jsonify({"success": False, "message": "Order not found"})


# ---------------- RESTORE ORDER (UNDO DELETE) ----------------
@app.route("/api/orders/restore", methods=["POST"])
def restore_order():
    """Restore a previously deleted order - used for undo functionality"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    data = request.json
    
    try:
        order = PurchaseOrder(
            order_number=data.get("order_number"),
            product_name=data.get("product_name"),
            quantity_ordered=data.get("quantity_ordered"),
            unit=data.get("unit"),
            delivery_due_date=data.get("delivery_due_date"),
            retailer_name=data.get("retailer_name"),
            retailer_email=data.get("retailer_email"),
            retailer_address=data.get("retailer_address"),
            retailer_phone=data.get("retailer_phone"),
            priority_level=data.get("priority_level", "Normal"),
            order_status=data.get("order_status", "Approved"),
            source_of_order=data.get("source_of_order", "Email"),
            remarks=data.get("remarks"),
            confidence_score=data.get("confidence_score", 100.0),
            extracted_text=data.get("extracted_text"),
            client_email_subject=data.get("client_email_subject"),
            attachment_path=data.get("attachment_path")
        )
        
        db_session.add(order)
        db_session.commit()
        
        return jsonify({"success": True, "message": "Order restored successfully", "order_id": order.id})
    
    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------- ADD CUSTOM ORDER ----------------
@app.route("/api/orders", methods=["POST"])
def add_custom_order():
    """Manually add a custom order - only for pythonprojectimap@gmail.com"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    # Only allow specific user to add custom orders
    if session.get("email_user") != "pythonprojectimap@gmail.com":
        return jsonify({"success": False, "message": "Not authorized to add custom orders"}), 403
    
    data = request.json
    
    try:
        order = PurchaseOrder(
            order_number=f"PO-{int(datetime.utcnow().timestamp())}",
            product_name=data.get("product_name"),
            quantity_ordered=data.get("quantity"),
            unit=data.get("unit"),
            delivery_due_date=data.get("due_date"),
            retailer_name=data.get("retailer_name"),
            retailer_email=data.get("retailer_email"),
            retailer_address=data.get("address"),
            retailer_phone=data.get("phone"),
            priority_level=data.get("priority", "Normal"),
            order_status="Approved",
            source_of_order="Manual",
            remarks=data.get("remarks"),
            confidence_score=100.0,
            extracted_text="Manually entered order"
        )
        
        db_session.add(order)
        db_session.commit()
        
        return jsonify({"success": True, "message": "Order added successfully", "order_id": order.id})
    
    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


# ---------------- GET ORDERS (AJAX) ----------------
@app.route("/api/orders")
def get_orders():
    # Debug session on every request
    print(f"DEBUG: Session keys: {list(session.keys())}")

    # Only return orders that are NOT soft-deleted
    orders = db_session.query(PurchaseOrder).filter(
        PurchaseOrder.deleted_at.is_(None)
    ).order_by(
        PurchaseOrder.created_at.desc()
    ).all()

    return jsonify([
        {
            "id": o.id,
            "product_name": o.product_name,
            "quantity_ordered": o.quantity_ordered,
            "delivery_due_date": o.delivery_due_date,
            "retailer_name": o.retailer_name,
            "retailer_email": o.retailer_email,
            "retailer_address": o.retailer_address,
            "retailer_phone": o.retailer_phone,
            "client_email_subject": o.client_email_subject,
            "order_status": o.order_status,
            "priority_level": o.priority_level,
            "confidence_score": o.confidence_score,
            "order_number": o.order_number,
            "created_at": str(o.created_at) if o.created_at else None,
            "processed_at": str(o.processed_at) if o.processed_at else None,
            "unit": o.unit,
            "source_of_order": o.source_of_order,
            "remarks": o.remarks,
            "extracted_text": o.extracted_text,
            "attachment_path": o.attachment_path
        }
        for o in orders
    ])


# ---------------- TRASH ENDPOINTS ----------------
@app.route("/api/trash")
def get_trash():
    """Get all soft-deleted orders still within the 30-day window"""
    cutoff = datetime.utcnow() - timedelta(days=30)

    # Permanently remove orders older than 30 days
    expired = db_session.query(PurchaseOrder).filter(
        PurchaseOrder.deleted_at.isnot(None),
        PurchaseOrder.deleted_at < cutoff
    ).all()
    for o in expired:
        db_session.delete(o)
    if expired:
        db_session.commit()

    # Return remaining trashed orders
    orders = db_session.query(PurchaseOrder).filter(
        PurchaseOrder.deleted_at.isnot(None)
    ).order_by(PurchaseOrder.deleted_at.desc()).all()

    return jsonify([
        {
            "id": o.id,
            "product_name": o.product_name,
            "quantity_ordered": o.quantity_ordered,
            "delivery_due_date": o.delivery_due_date,
            "retailer_name": o.retailer_name,
            "retailer_email": o.retailer_email,
            "order_status": o.order_status,
            "priority_level": o.priority_level,
            "confidence_score": o.confidence_score,
            "deleted_at": str(o.deleted_at) if o.deleted_at else None,
            "days_remaining": max(0, 30 - (datetime.utcnow() - o.deleted_at).days) if o.deleted_at else 0
        }
        for o in orders
    ])


@app.route("/api/trash/restore/<int:order_id>", methods=["POST"])
def restore_from_trash(order_id):
    """Restore a soft-deleted order"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    order = db_session.query(PurchaseOrder).get(order_id)
    if order and order.deleted_at is not None:
        order.deleted_at = None
        db_session.commit()
        return jsonify({"success": True, "message": "Order restored successfully"})

    return jsonify({"success": False, "message": "Order not found in trash"})


@app.route("/api/trash/<int:order_id>", methods=["DELETE"])
def permanent_delete(order_id):
    """Permanently delete an order from trash"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    order = db_session.query(PurchaseOrder).get(order_id)
    if order and order.deleted_at is not None:
        db_session.delete(order)
        db_session.commit()
        return jsonify({"success": True, "message": "Order permanently deleted"})

    return jsonify({"success": False, "message": "Order not found in trash"})


@app.route("/api/bulk-delete", methods=["POST"])
def bulk_delete():
    """Soft-delete multiple orders at once"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    ids = request.json.get("ids", [])
    if not ids:
        return jsonify({"success": False, "message": "No IDs provided"})

    count = 0
    for oid in ids:
        order = db_session.query(PurchaseOrder).get(oid)
        if order and order.deleted_at is None:
            order.deleted_at = datetime.utcnow()
            count += 1
    db_session.commit()
    return jsonify({"success": True, "message": f"{count} order(s) moved to trash"})


@app.route("/api/trash/bulk-delete", methods=["POST"])
def bulk_permanent_delete():
    """Permanently delete multiple orders from trash"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    ids = request.json.get("ids", [])
    if not ids:
        return jsonify({"success": False, "message": "No IDs provided"})

    count = 0
    for oid in ids:
        order = db_session.query(PurchaseOrder).get(oid)
        if order and order.deleted_at is not None:
            db_session.delete(order)
            count += 1
    db_session.commit()
    return jsonify({"success": True, "message": f"{count} order(s) permanently deleted"})


@app.route("/api/trash/bulk-restore", methods=["POST"])
def bulk_restore():
    """Restore multiple orders from trash"""
    if "email_user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    ids = request.json.get("ids", [])
    if not ids:
        return jsonify({"success": False, "message": "No IDs provided"})

    count = 0
    for oid in ids:
        order = db_session.query(PurchaseOrder).get(oid)
        if order and order.deleted_at is not None:
            order.deleted_at = None
            count += 1
    db_session.commit()
    return jsonify({"success": True, "message": f"{count} order(s) restored"})


# ---------------- SERVE ATTACHMENTS ----------------
@app.route("/attachments/<path:filename>")
def serve_attachment(filename):
    """Serve email attachment files"""
    attachments_dir = os.path.join(BASE_DIR, "extractor", "attachments")
    return send_from_directory(attachments_dir, filename)


# ---------------- EXPORT EXCEL ----------------
@app.route("/export/excel")
def export_excel():
    if "email_user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    query = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None)
    ids_param = request.args.get("ids")
    if ids_param:
        id_list = [int(x) for x in ids_param.split(",") if x.strip().isdigit()]
        if id_list:
            query = query.filter(PurchaseOrder.id.in_(id_list))
    orders = query.all()

    df = pd.DataFrame([{
        "Order No": o.order_number,
        "Product": o.product_name,
        "Quantity": o.quantity_ordered,
        "Due Date": o.delivery_due_date,
        "Retailer": o.retailer_name,
        "Email": o.retailer_email,
        "Priority": o.priority_level,
        "Confidence": o.confidence_score,
        "Status": o.order_status
    } for o in orders])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)

    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="ERP_Orders.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# ---------------- EXPORT PDF ----------------
@app.route("/export/pdf")
def export_pdf():
    if "email_user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    query = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None)
    ids_param = request.args.get("ids")
    if ids_param:
        id_list = [int(x) for x in ids_param.split(",") if x.strip().isdigit()]
        if id_list:
            query = query.filter(PurchaseOrder.id.in_(id_list))
    orders = query.all()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 14)
    pdf.cell(200, 10, "ERP Purchase Order Report", ln=True, align="C")
    pdf.ln(10)
    pdf.set_font("Arial", size=11)

    for o in orders:
        text = f"""
Order No: {o.order_number}
Product: {o.product_name}
Quantity: {o.quantity_ordered}
Due Date: {o.delivery_due_date}
Retailer: {o.retailer_name}
Email: {o.retailer_email}
Priority: {o.priority_level}
Confidence: {o.confidence_score}
Status: {o.order_status}
-----------------------------
"""
        pdf.multi_cell(0, 8, text.encode("latin-1", "ignore").decode("latin-1"))

    output = io.BytesIO()
    pdf.output(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="ERP_Orders.pdf",
        mimetype="application/pdf"
    )


# ---------------- EXPORT CSV ----------------
@app.route("/export/csv")
def export_csv():
    if "email_user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    query = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None)
    ids_param = request.args.get("ids")
    if ids_param:
        id_list = [int(x) for x in ids_param.split(",") if x.strip().isdigit()]
        if id_list:
            query = query.filter(PurchaseOrder.id.in_(id_list))
    orders = query.all()

    df = pd.DataFrame([{
        "Order No": o.order_number,
        "Product": o.product_name,
        "Quantity": o.quantity_ordered,
        "Due Date": o.delivery_due_date,
        "Retailer": o.retailer_name,
        "Email": o.retailer_email,
        "Priority": o.priority_level,
        "Confidence": o.confidence_score,
        "Status": o.order_status
    } for o in orders])

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        as_attachment=True,
        download_name="ERP_Orders.csv",
        mimetype="text/csv"
    )


# ---------------- EXPORT JSON ----------------
@app.route("/export/json")
def export_json():
    if "email_user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    query = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None)
    ids_param = request.args.get("ids")
    if ids_param:
        id_list = [int(x) for x in ids_param.split(",") if x.strip().isdigit()]
        if id_list:
            query = query.filter(PurchaseOrder.id.in_(id_list))
    orders = query.all()

    data = [{
        "order_number": o.order_number,
        "product_name": o.product_name,
        "quantity_ordered": o.quantity_ordered,
        "delivery_due_date": o.delivery_due_date,
        "retailer_name": o.retailer_name,
        "retailer_email": o.retailer_email,
        "priority_level": o.priority_level,
        "confidence_score": o.confidence_score,
        "order_status": o.order_status
    } for o in orders]

    output = io.BytesIO(json.dumps(data, indent=2).encode("utf-8"))
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="ERP_Orders.json",
        mimetype="application/json"
    )


# ---------------- EXPORT XML ----------------
@app.route("/export/xml")
def export_xml():
    if "email_user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    query = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None)
    ids_param = request.args.get("ids")
    if ids_param:
        id_list = [int(x) for x in ids_param.split(",") if x.strip().isdigit()]
        if id_list:
            query = query.filter(PurchaseOrder.id.in_(id_list))
    orders = query.all()

    root = ET.Element("Orders")
    for o in orders:
        order_el = ET.SubElement(root, "Order")
        ET.SubElement(order_el, "OrderNumber").text = str(o.order_number or "")
        ET.SubElement(order_el, "Product").text = str(o.product_name or "")
        ET.SubElement(order_el, "Quantity").text = str(o.quantity_ordered or "")
        ET.SubElement(order_el, "DueDate").text = str(o.delivery_due_date or "")
        ET.SubElement(order_el, "Retailer").text = str(o.retailer_name or "")
        ET.SubElement(order_el, "Email").text = str(o.retailer_email or "")
        ET.SubElement(order_el, "Priority").text = str(o.priority_level or "")
        ET.SubElement(order_el, "Confidence").text = str(o.confidence_score or "")
        ET.SubElement(order_el, "Status").text = str(o.order_status or "")

    output = io.StringIO()
    tree = ET.ElementTree(root)
    tree.write(output, encoding="unicode", xml_declaration=True)
    output_bytes = io.BytesIO(output.getvalue().encode("utf-8"))
    output_bytes.seek(0)

    return send_file(
        output_bytes,
        as_attachment=True,
        download_name="ERP_Orders.xml",
        mimetype="application/xml"
    )


# ---------------- CUSTOM EXPORT ----------------
# Field mapping: key -> (display label, model attribute)
EXPORT_FIELD_MAP = {
    "order_number":       ("Order No",        lambda o: o.order_number),
    "product_name":       ("Product",         lambda o: o.product_name),
    "quantity_ordered":   ("Quantity",         lambda o: o.quantity_ordered),
    "unit":               ("Unit",             lambda o: o.unit),
    "delivery_due_date":  ("Due Date",         lambda o: o.delivery_due_date),
    "retailer_name":      ("Retailer",         lambda o: o.retailer_name),
    "retailer_email":     ("Email",            lambda o: o.retailer_email),
    "retailer_address":   ("Address",          lambda o: o.retailer_address),
    "retailer_phone":     ("Phone",            lambda o: o.retailer_phone),
    "order_status":       ("Status",           lambda o: o.order_status),
    "priority_level":     ("Priority",         lambda o: o.priority_level),
    "confidence_score":   ("Confidence",       lambda o: o.confidence_score),
    "source_of_order":    ("Source",           lambda o: o.source_of_order),
    "remarks":            ("Remarks",          lambda o: o.remarks),
    "created_at":         ("Created At",       lambda o: str(o.created_at) if o.created_at else None),
    "processed_at":       ("Processed At",     lambda o: str(o.processed_at) if o.processed_at else None),
    "client_email_subject": ("Email Subject",  lambda o: o.client_email_subject),
}


@app.route("/export/custom", methods=["POST"])
def custom_export():
    """Export orders with user-selected fields in chosen format (pdf/excel)"""
    if "email_user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    selected_fields = data.get("fields", [])
    export_format = data.get("format", "excel")  # 'excel' or 'pdf'
    selected_ids = data.get("ids", [])  # optional list of order IDs

    if not selected_fields:
        return jsonify({"error": "No fields selected"}), 400

    # Validate fields
    valid_fields = [f for f in selected_fields if f in EXPORT_FIELD_MAP]
    if not valid_fields:
        return jsonify({"error": "No valid fields selected"}), 400

    orders = db_session.query(PurchaseOrder).filter(PurchaseOrder.deleted_at == None)
    if selected_ids:
        orders = orders.filter(PurchaseOrder.id.in_(selected_ids))
    orders = orders.all()

    if export_format == "pdf":
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 14)
        pdf.cell(200, 10, "ERP Purchase Order Report (Custom)", ln=True, align="C")
        pdf.ln(10)
        pdf.set_font("Arial", size=11)

        for o in orders:
            lines = []
            for f in valid_fields:
                label, getter = EXPORT_FIELD_MAP[f]
                value = getter(o)
                lines.append(f"{label}: {value}")
            lines.append("-----------------------------")
            text = "\n".join(lines)
            pdf.multi_cell(0, 8, text.encode("latin-1", "ignore").decode("latin-1"))
            pdf.ln(2)

        output = io.BytesIO()
        pdf.output(output)
        output.seek(0)

        return send_file(
            output,
            as_attachment=True,
            download_name="ERP_Orders_Custom.pdf",
            mimetype="application/pdf"
        )

    elif export_format == "csv":
        rows = []
        headers = []
        for f in valid_fields:
            label, getter = EXPORT_FIELD_MAP[f]
            headers.append(label)
        for o in orders:
            row = {}
            for f in valid_fields:
                label, getter = EXPORT_FIELD_MAP[f]
                row[label] = getter(o)
            rows.append(row)

        df = pd.DataFrame(rows, columns=headers)
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            as_attachment=True,
            download_name="ERP_Orders_Custom.csv",
            mimetype="text/csv"
        )

    elif export_format == "json":
        data = []
        for o in orders:
            row = {}
            for f in valid_fields:
                label, getter = EXPORT_FIELD_MAP[f]
                row[f] = getter(o)
            data.append(row)

        output = io.BytesIO(json.dumps(data, indent=2, default=str).encode("utf-8"))
        output.seek(0)

        return send_file(
            output,
            as_attachment=True,
            download_name="ERP_Orders_Custom.json",
            mimetype="application/json"
        )

    elif export_format == "xml":
        root = ET.Element("Orders")
        for o in orders:
            order_el = ET.SubElement(root, "Order")
            for f in valid_fields:
                label, getter = EXPORT_FIELD_MAP[f]
                tag = f.replace("_", "").title().replace(" ", "")
                ET.SubElement(order_el, tag).text = str(getter(o) or "")

        output = io.StringIO()
        tree = ET.ElementTree(root)
        tree.write(output, encoding="unicode", xml_declaration=True)
        output_bytes = io.BytesIO(output.getvalue().encode("utf-8"))
        output_bytes.seek(0)

        return send_file(
            output_bytes,
            as_attachment=True,
            download_name="ERP_Orders_Custom.xml",
            mimetype="application/xml"
        )

    else:  # excel
        rows = []
        for o in orders:
            row = {}
            for f in valid_fields:
                label, getter = EXPORT_FIELD_MAP[f]
                row[label] = getter(o)
            rows.append(row)

        df = pd.DataFrame(rows)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False)

        output.seek(0)

        return send_file(
            output,
            as_attachment=True,
            download_name="ERP_Orders_Custom.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)

