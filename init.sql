DROP TABLE IF EXISTS hcs;

CREATE TABLE quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    cover_type TEXT NOT NULL CHECK (cover_type IN ('Single', 'Couple', 'Family')),
    app1_age INTEGER NOT NULL CHECK (app1_age BETWEEN 18 AND 100),
    app1_hch TEXT NOT NULL CHECK (app1_hch IN ('Yes', 'No', 'Not Sure')),
    app2_age INTEGER CHECK (app2_age IS NULL OR (app2_age BETWEEN 18 AND 100)),
    app2_hch TEXT CHECK (app2_hch IS NULL OR app2_hch IN ('Yes', 'No', 'Not Sure')),
    hos_cl TEXT NOT NULL CHECK (hos_cl IN ('None', 'Basic', 'Bronze', 'Silver', 'Gold')),
    ext_cl TEXT NOT NULL CHECK (ext_cl IN ('None', 'Basic', 'Standard', 'Premium')),
    pay_freq TEXT NOT NULL CHECK (pay_freq IN ('Monthly', 'Yearly')),
    ann_discount REAL NOT NULL DEFAULT 0 CHECK (ann_discount >= 0 AND ann_discount <= 10),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
