"""
Seed script: Insert 50 sample purchase orders into the database.
Run once:  python seed_data.py
"""
import random, hashlib
from datetime import datetime, timedelta
from erp.models import PurchaseOrder, session, Base, engine

# Ensure tables exist
Base.metadata.create_all(engine)

products = [
    "Basmati Rice", "Wheat Flour", "Sunflower Oil", "Olive Oil", "Sugar",
    "Salt", "Turmeric Powder", "Red Chilli Powder", "Cumin Seeds", "Coriander Powder",
    "Black Pepper", "Cardamom", "Cinnamon Sticks", "Tea Leaves", "Coffee Beans",
    "Milk Powder", "Butter", "Cheese Slices", "Paneer", "Yogurt",
    "Tomato Ketchup", "Soy Sauce", "Vinegar", "Honey", "Jam",
    "Biscuits", "Bread", "Pasta", "Noodles", "Corn Flakes",
    "Almonds", "Cashews", "Peanuts", "Raisins", "Walnuts",
    "Soap Bar", "Shampoo", "Toothpaste", "Detergent", "Hand Wash",
    "Notebook", "Pen Set", "Printer Paper", "Stapler", "Glue Stick",
    "Face Mask", "Sanitizer", "Tissue Box", "Paper Cups", "Garbage Bags"
]

retailers = [
    ("Reliance Fresh", "reliance@store.com", "+91-9876543210", "Mumbai, Maharashtra"),
    ("BigBasket", "orders@bigbasket.com", "+91-9123456780", "Bangalore, Karnataka"),
    ("DMart", "purchase@dmart.in", "+91-9988776655", "Pune, Maharashtra"),
    ("Spencer's Retail", "buy@spencers.in", "+91-9112233445", "Chennai, Tamil Nadu"),
    ("More Supermarket", "supply@more.in", "+91-9001122334", "Hyderabad, Telangana"),
    ("Star Bazaar", "orders@starbazaar.com", "+91-9334455667", "Ahmedabad, Gujarat"),
    ("Nilgiris", "procurement@nilgiris.com", "+91-9445566778", "Coimbatore, Tamil Nadu"),
    ("Spar Hypermarket", "orders@spar.in", "+91-9556677889", "Delhi, NCR"),
    ("Nature's Basket", "fresh@naturesbasket.com", "+91-9667788990", "Kolkata, West Bengal"),
    ("Easyday", "supply@easyday.in", "+91-9778899001", "Lucknow, Uttar Pradesh"),
]

units = ["pcs", "kg", "g", "litre", "packs", "boxes", "dozen"]
statuses = ["Pending", "Approved", "Needs Review", "Rejected"]
priorities = ["Normal", "Urgent", "Low"]
sources = ["Email", "Manual"]

now = datetime.utcnow()

for i in range(50):
    product = products[i]
    retailer = random.choice(retailers)
    days_ago = random.randint(0, 30)
    order_date = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
    due_date = order_date + timedelta(days=random.randint(3, 15))
    qty = random.randint(5, 500)
    unit = random.choice(units)
    status = random.choices(statuses, weights=[40, 35, 15, 10])[0]
    priority = random.choices(priorities, weights=[60, 25, 15])[0]
    confidence = round(random.uniform(60.0, 99.9), 1)

    email_hash = hashlib.md5(f"seed-{i}-{product}-{order_date.isoformat()}".encode()).hexdigest()

    order = PurchaseOrder(
        order_number=f"PO-SAMPLE-{1001 + i}",
        order_date=order_date,
        product_name=product,
        quantity_ordered=str(qty),
        unit=unit,
        delivery_due_date=due_date.strftime("%Y-%m-%d"),
        retailer_name=retailer[0],
        retailer_email=retailer[1],
        retailer_address=retailer[3],
        retailer_phone=retailer[2],
        extracted_text=f"Hi, please deliver {qty} {unit} of {product} by {due_date.strftime('%d %b %Y')}. Thanks, {retailer[0]}.",
        confidence_score=confidence,
        priority_level=priority,
        duplicate_flag=False,
        email_hash=email_hash,
        order_status=status,
        source_of_order=random.choice(sources),
        remarks=random.choice([None, "Bulk order", "Repeat customer", "First-time order", "Seasonal demand", "Urgent delivery needed"]),
        created_at=order_date,
        processed_at=order_date + timedelta(minutes=random.randint(1, 60)),
        client_email_subject=f"Order for {product} - {retailer[0]}",
        attachment_path=None,
        deleted_at=None,
    )

    session.add(order)

try:
    session.commit()
    print("[OK] Successfully inserted 50 sample orders!")
except Exception as e:
    session.rollback()
    print(f"[ERROR] Error: {e}")
finally:
    session.remove()
