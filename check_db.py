import sys
import os

# Set up path so we can import from erp
sys.path.append(os.getcwd())

from erp.models import session, PurchaseOrder

try:
    orders = session.query(PurchaseOrder).all()
    print(f"Successfully connected to DB. Found {len(orders)} orders.")
    for o in orders:
        print(f"ID: {o.id}, Product: {o.product_name}, Status: {o.order_status}")
except Exception as e:
    print(f"Error querying database: {e}")
