"""
Seed script: Insert 100 synthetic orders into the database.
Run from the project root:  python seed_orders.py
"""
import sys, os, random, hashlib
from datetime import datetime, timedelta

# Ensure project root is on path so config & models import correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from erp.models import PurchaseOrder, session, Base, engine

# ---------- Realistic sample data pools ----------
PRODUCTS = [
    "Basmati Rice 5kg", "Toor Dal 1kg", "Olive Oil 1L", "Whole Wheat Flour 10kg",
    "Sugar 5kg", "Salt 1kg", "Turmeric Powder 500g", "Red Chilli Powder 200g",
    "Mustard Oil 2L", "Coconut Oil 500ml", "Green Tea 100 bags", "Coffee Beans 1kg",
    "Almond Milk 1L", "Soy Sauce 500ml", "Tomato Ketchup 1kg", "Pasta 500g",
    "Cornflakes 750g", "Honey 500g", "Peanut Butter 1kg", "Dark Chocolate 200g",
    "Oats 1kg", "Quinoa 500g", "Lentils Red 1kg", "Chickpeas 1kg",
    "Brown Rice 5kg", "Jasmine Rice 2kg", "Coconut Milk 400ml", "Ghee 1L",
    "Butter 500g", "Cheese Block 200g", "Yogurt 1kg", "Paneer 500g",
    "Saffron 5g", "Cardamom 100g", "Cinnamon Sticks 200g", "Black Pepper 250g",
    "Cumin Seeds 200g", "Coriander Powder 500g", "Garam Masala 100g", "Paprika 150g",
    "Biscuits Assorted 1kg", "Bread Whole Wheat", "Noodles Pack 500g", "Vinegar 500ml",
    "Maple Syrup 250ml", "Jam Strawberry 500g", "Pickles Mixed 1kg", "Crackers 300g",
    "Popcorn Kernels 500g", "Trail Mix 400g"
]

RETAILERS = [
    ("Reliance Fresh", "orders@reliancefresh.in", "MG Road, Mumbai 400001", "+91-22-12345678"),
    ("DMart Wholesale", "procurement@dmart.co.in", "Andheri West, Mumbai 400058", "+91-22-87654321"),
    ("BigBasket Corp", "b2b@bigbasket.com", "Koramangala, Bengaluru 560034", "+91-80-55512345"),
    ("Spencer's Retail", "supply@spencers.in", "Park Street, Kolkata 700016", "+91-33-44456789"),
    ("Nature's Basket", "orders@naturesbasket.co.in", "Bandra, Mumbai 400050", "+91-22-33344455"),
    ("Star Bazaar", "purchase@starbazaar.com", "Whitefield, Bengaluru 560066", "+91-80-99988877"),
    ("More Supermarket", "vendor@moreretail.in", "Indiranagar, Bengaluru 560038", "+91-80-22233344"),
    ("Hypercity", "orders@hypercity.in", "Malad West, Mumbai 400064", "+91-22-77766655"),
    ("Easyday Club", "supply@easyday.co.in", "Sector 18, Noida 201301", "+91-120-4455667"),
    ("Vishal Mega Mart", "bulk@vishalmegamart.com", "Rajouri Garden, Delhi 110027", "+91-11-22334455"),
    ("Grofers Business", "enterprise@grofers.com", "Gurugram, Haryana 122001", "+91-124-6677889"),
    ("Metro Cash & Carry", "india.orders@metro.com", "Navi Mumbai 400710", "+91-22-11122233"),
    ("Walmart India", "supplier@walmart.in", "Electronic City, Bengaluru 560100", "+91-80-44455566"),
    ("Spar Hypermarket", "procurement@spar.in", "HSR Layout, Bengaluru 560102", "+91-80-33322211"),
    ("FoodHall", "orders@foodhall.com", "Linking Road, Mumbai 400052", "+91-22-66677788"),
    ("Nilgiris", "supply@nilgiris.in", "T Nagar, Chennai 600017", "+91-44-55566677"),
    ("Heritage Fresh", "orders@heritagefresh.in", "Jubilee Hills, Hyderabad 500033", "+91-40-88899900"),
    ("Ratnadeep", "purchase@ratnadeep.in", "Banjara Hills, Hyderabad 500034", "+91-40-77788899"),
    ("Smart Bazaar", "orders@smartbazaar.in", "Deccan, Pune 411004", "+91-20-33344455"),
    ("Pacific Mall Supplies", "vendor@pacificmall.in", "Subhash Nagar, Delhi 110027", "+91-11-99900011"),
]

STATUSES = ["Approved", "Needs Review", "Pending", "Rejected"]
STATUS_WEIGHTS = [40, 30, 20, 10]
PRIORITIES = ["Normal", "Urgent"]
UNITS = ["pcs", "kg", "g", "litre", "ml", "bags", "packs", "boxes", "bottles", "cartons"]
SOURCES = ["Email", "Email", "Email", "Email", "Manual"]  # 80% email

EMAIL_SUBJECTS = [
    "PO for {product} - Urgent Delivery",
    "New Order: {product}",
    "Order Request - {product} x{qty}",
    "Re: Monthly Supply - {product}",
    "Fw: Purchase Order #{po}",
    "Bulk Order Request - {product}",
    "{retailer} - New Purchase Order",
    "Order Confirmation Needed: {product}",
    "Supply Request: {product} ({qty} units)",
    "Immediate Requirement - {product}",
]

def gen_email_body(product, qty, unit, retailer, due):
    return (
        f"Dear Supplier,\n\n"
        f"We would like to place an order for the following:\n\n"
        f"Product: {product}\n"
        f"Quantity: {qty} {unit}\n"
        f"Delivery By: {due}\n\n"
        f"Please confirm the order at your earliest convenience.\n\n"
        f"Best regards,\n{retailer}"
    )

def seed():
    base_time = datetime(2026, 1, 1)
    created = 0

    for i in range(100):
        product = random.choice(PRODUCTS)
        retailer = random.choice(RETAILERS)
        qty = str(random.choice([5, 10, 15, 20, 25, 50, 100, 200, 250, 500, 1000]))
        unit = random.choice(UNITS)
        priority = random.choices(PRIORITIES, weights=[75, 25])[0]
        status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
        confidence = round(random.uniform(55, 99), 1)
        source = random.choice(SOURCES)

        # Spread orders over ~40 days
        created_at = base_time + timedelta(
            days=random.randint(0, 40),
            hours=random.randint(6, 22),
            minutes=random.randint(0, 59)
        )
        due_date = (created_at + timedelta(days=random.randint(3, 21))).strftime("%Y-%m-%d")

        # Unique hash for each synthetic entry
        raw_hash = f"SEED-{i}-{product}-{retailer[0]}-{created_at.isoformat()}"
        email_hash = hashlib.sha256(raw_hash.encode()).hexdigest()

        po_number = f"PO-SEED-{1000 + i}"
        subject_template = random.choice(EMAIL_SUBJECTS)
        subject = subject_template.format(
            product=product, qty=qty, po=po_number, retailer=retailer[0]
        )
        body = gen_email_body(product, qty, unit, retailer[0], due_date)

        # Remarks
        remarks = None
        if confidence < 70:
            remarks = random.choice([
                "Low confidence - missing quantity details",
                "Low confidence - unclear product name",
                "Missing delivery date, needs review",
            ])
        elif status == "Needs Review":
            remarks = random.choice([
                "Verify retailer address",
                "Confirm quantity with retailer",
                "Check duplicate order possibility",
            ])

        order = PurchaseOrder(
            order_number=po_number,
            order_date=created_at,
            product_name=product,
            quantity_ordered=qty,
            unit=unit,
            delivery_due_date=due_date,
            retailer_name=retailer[0],
            retailer_email=retailer[1],
            retailer_address=retailer[2],
            retailer_phone=retailer[3],
            extracted_text=body if source == "Email" else None,
            confidence_score=confidence,
            priority_level=priority,
            duplicate_flag=False,
            email_hash=email_hash,
            order_status=status,
            source_of_order=source,
            remarks=remarks,
            created_at=created_at,
            processed_at=created_at + timedelta(minutes=random.randint(1, 30)),
            client_email_subject=subject if source == "Email" else None,
            attachment_path=None,
            deleted_at=None,
        )
        session.add(order)
        created += 1

    session.commit()
    print(f"[OK] Successfully inserted {created} synthetic orders.")


if __name__ == "__main__":
    seed()
