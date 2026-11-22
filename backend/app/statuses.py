"""Order statuses: labels, allowed changes, and the supplier dashboard groups."""

STATUS_LABELS = {
    "pending": "تم استلام الطلب",
    "accepted": "وافق المورد",
    "on_the_way": "الوايت في الطريق",
    "arrived": "وصل إلى الموقع",
    "delivered": "تم التسليم",
    "rejected": "رفض المورد الطلب",
    "cancelled": "ملغي",
}

# Supplier: from status -> statuses it may move to.
SUPPLIER_CHANGES = {
    "pending": {"accepted", "rejected"},
    "accepted": {"on_the_way", "delivered"},
    "on_the_way": {"arrived", "delivered"},
    "arrived": {"delivered"},
}

# Customer may cancel only before the tanker leaves.
CANCELLABLE = {"pending", "accepted"}

# The customer sees the supplier phone only while the order is being delivered.
SHOW_SUPPLIER_PHONE = {"accepted", "on_the_way", "arrived"}

ORDER_GROUPS = {
    "incoming": ["pending"],
    "active": ["accepted", "on_the_way", "arrived"],
    "history": ["delivered", "rejected", "cancelled"],
}
HISTORY_LIMIT = 50
