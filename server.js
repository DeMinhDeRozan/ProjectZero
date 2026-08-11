import express from "express";
import path from "node:path";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3001;
const app = express();
const db = new DatabaseSync(path.join(__dirname, "hcs.db"));
app.use(express.json());
app.use(cors());

const sql = `
CREATE TABLE IF NOT EXISTS hcs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
customer_name TEXT NOT NULL,
cover_type TEXT NOT NULL CHECK (cover_type IN ('Single', 'Couple', 'Family')),
app1_age INTEGER NOT NULL CHECK (app1_age BETWEEN 18 AND 100),
app1_hch TEXT NOT NULL CHECK (app1_hch IN ('Yes', 'No', 'Not Sure')),
app2_age INTEGER CHECK (app2_age BETWEEN 18 AND 100),
app2_hch TEXT CHECK (app2_hch IN ('Yes', 'No', 'Not Sure')),
hos_cl TEXT NOT NULL CHECK (hos_cl IN ('None', 'Basic', 'Bronze', 'Silver', 'Gold')),
ext_cl TEXT NOT NULL CHECK (ext_cl IN ('None', 'Basic', 'Standard', 'Premium')),
pay_freq TEXT NOT NULL CHECK (pay_freq IN ('Monthly', 'Yearly')),
ann_discount REAL NOT NULL DEFAULT 0 CHECK (ann_discount >= 0 and ann_discount<=10),
notes TEXT
)
`;
db.exec(sql);

const hos_cover = { None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220 };
const ext_cover = { None: 0, Basic: 25, Standard: 45, Premium: 70 };
const LHC_STATEMENT =
  "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.";
const cover_type = ["Single", "Couple", "Family"];
const cover_history = ["Yes", "No", "Not Sure"];
const hos_cl = ["None", "Basic", "Bronze", "Silver", "Gold"];
const ext_cl = ["None", "Basic", "Standard", "Premium"];
const pay_freq = ["Monthly", "Yearly"];

function checkQuoteData(data) {
  if (
    !data.customer_name ||
    data.customer_name.trim() === "" ||
    typeof data.customer_name !== "string"
  ) {
    return "Customer name is required.";
  }
  let regex = /\d/;
  if (regex.test(data.customer_name)) {
    return 'Customer name cannot contain numbers.';
  }
  if (!cover_type.includes(data.cover_type)) {
    return "Invalid cover type.";
  }
  if (
    typeof data.app1_age !== "number" ||
    data.app1_age < 18 ||
    data.app1_age > 100
  ) {
    return "Applicant 1 age must be a number between 18 and 100.";
  }
  if (!cover_history.includes(data.app1_hch)) {
    return "Invalid applicant 1 health cover history.";
  }
  if (data.cover_type !== "Single") {
    if (
      typeof data.app2_age !== "number" ||
      data.app2_age < 18 ||
      data.app2_age > 100
    ) {
      return "Applicant 2 age must be a number between 18 and 100 for Couple or Family cover.";
    }
    if (!cover_history.includes(data.app2_hch)) {
      return "Invalid applicant 2 health cover history for Couple or Family cover.";
    }
  }
  if (!hos_cl.includes(data.hos_cl)) {
    return "Invalid hospital cover level.";
  }
  if (!ext_cl.includes(data.ext_cl)) {
    return "Invalid extras cover level.";
  }
  if (!pay_freq.includes(data.pay_freq)) {
    return "Invalid payment frequency.";
  }
  if (data.pay_freq !== "Monthly") {
    if (
      typeof data.ann_discount !== "number" ||
      data.ann_discount < 0 ||
      data.ann_discount > 10
    ) {
      return "Annual discount must be a number between 0 and 10 for yearly payment frequency.";
    }
  }
  return null;
}

function QuoteCalculator(data) {
  let app_1 = 0;
  let adult_count = 1;
  let warnings = [];
  let app_2 = 0;
  if (data.app1_hch === "No") {
    if (data.app1_age > 30) {
      app_1 = (data.app1_age - 30) * 0.02;
    }
  }
  if (data.app1_hch === "Not Sure") {
    warnings.push(
      "Applicant 1: Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate."
    );
  }
  let LHC = hos_cover[data.hos_cl] * (1 + app_1);
  let LHC_total = LHC;
  if (data.cover_type === "Couple" || data.cover_type === "Family") {
    adult_count = 2;
    if (data.app2_hch === "No") {
      if (data.app2_age > 30) {
        app_2 = (data.app2_age - 30) * 0.02;
      }
    }
    LHC += hos_cover[data.hos_cl] * (1 + app_2);
  }
  if (data.app2_hch === "Not Sure") {
    warnings.push(
      "Applicant 2: Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate."
    );
  }
  let total_ext = ext_cover[data.ext_cl] * adult_count;
  LHC_total = (LHC + total_ext) * 12;
  let family_upgrade_fee = 0;
  let LHC_total_final = LHC_total;

  if (data.cover_type === "Family") {
    warnings.push(
      "Family policy includes a $30/month upgrade fee to cover eligible dependents."
    );
    family_upgrade_fee = 30;
    LHC_total += family_upgrade_fee * 12;
  }
  if (data.pay_freq === "Yearly") {
    LHC_total_final = LHC_total * (1 - data.ann_discount / 100);
  }

  let explanation =
    `- Quote calculated for a ${data.cover_type} policy with ${data.pay_freq} payment.` +
    `\n- Hospital cover totals $${LHC.toFixed(
      2
    )}/month for ${adult_count} adult(s).` +
    `\n- Extras cover totals $${total_ext.toFixed(2)}/month.` +
    (family_upgrade_fee > 0
      ? `\n- A $${family_upgrade_fee}/month family upgrade fee is included.`
      : ``) +
    `\n- Monthly premium of $${(LHC_total / 12).toFixed(2)}.` +
    `\n- Yearly total of $${LHC_total.toFixed(2)}` +
    (data.pay_freq === "Yearly"
      ? ` (discounted to $${LHC_total_final.toFixed(2)} after ${
          data.ann_discount
        }% annual discount).`
      : `.`);
  let result = {
    "Estimated Monthly Premium": (LHC_total / 12).toFixed(2),
    "Hospital Premium": LHC.toFixed(2),
    "Extras Premium": total_ext.toFixed(2),

    ...(data.pay_freq === "Yearly"
      ? {
          "Estimated Yearly Premium before Discount": LHC_total.toFixed(2),
          "Estimated Yearly Premium after Discount": LHC_total_final.toFixed(2),
        }
      : { "Estimated Yearly Premium": LHC_total.toFixed(2) }),

    "Lifetime Health Cover Statement": LHC_STATEMENT,

    ...(adult_count > 1
      ? {
          "Applicant 1 LHC Loading": app_1 * 100 + "%",
          "Applicant 2 LHC Loading": app_2 * 100 + "%",
        }
      : {
          "Applicant LHC Loading": app_1 * 100 + "%",
        }),

    ...(data.cover_type === "Family" && {
      "Family Upgrade Fee": family_upgrade_fee.toFixed(2),
    }),
    Warnings: warnings.length > 0 ? warnings.join(" ") : "N/A",
    Explanation: explanation,
  };
  return result;
}

//CREATE
app.post("/api/quote", (req, res) => {
  const check1 = checkQuoteData(req.body);
  if (check1) {
    res.status(400).json({ error: check1 });
    return;
  }
  const c_body = req.body;
  try {
    const a = db
      .prepare(
        "INSERT INTO hcs (customer_name, cover_type, app1_age, app1_hch, app2_age, app2_hch, hos_cl, ext_cl, pay_freq, ann_discount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        c_body.customer_name,
        c_body.cover_type,
        c_body.app1_age,
        c_body.app1_hch,
        c_body.cover_type === "Single" ? null : c_body.app2_age,
        c_body.cover_type === "Single" ? null : c_body.app2_hch,
        c_body.hos_cl,
        c_body.ext_cl,
        c_body.pay_freq,
        c_body.ann_discount,
        c_body.notes || null
      );
    res.status(201).json({ id: a.lastInsertRowid, ...c_body });
  } catch (error) {
    res.status(400).json({ error: "Unknown error" });
  }
});
//READ
app.get("/api/quote", (req, res) => {
  const rows = db.prepare("SELECT * FROM hcs ORDER BY id DESC").all();
  res.json(rows);
});

//LIST
app.get("/api/quote/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM hcs WHERE id = ?").get(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Quote not found" });
  } else {
    const price = QuoteCalculator(row);
    res.json({ ...row, price });
  }
});

//UPDATE
app.put("/api/quote/:id", (req, res) => {
  const check2 = checkQuoteData(req.body);
  if (check2) {
    res.status(400).json({ error: check2 });
    return;
  }
  const u_body = req.body;
  try {
    const r2 = db
      .prepare(
        "UPDATE hcs SET customer_name = ?, cover_type = ?, app1_age = ?, app1_hch = ?, app2_age = ?, app2_hch = ?, hos_cl = ?, ext_cl = ?, pay_freq = ?, ann_discount = ?, notes = ? WHERE id = ?"
      )
      .run(
        u_body.customer_name,
        u_body.cover_type,
        u_body.app1_age,
        u_body.app1_hch,
        u_body.cover_type === "Single" ? null : u_body.app2_age,
        u_body.cover_type === "Single" ? null : u_body.app2_hch,
        u_body.hos_cl,
        u_body.ext_cl,
        u_body.pay_freq,
        u_body.ann_discount,
        u_body.notes || null,
        req.params.id
      );
    if (r2.changes === 0) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }
    res.json({ id: Number(req.params.id), ...u_body });
  } catch (error) {
    res.status(400).json({ error: "Unknown error" });
  }
});

//DELETE
app.delete("/api/quote/:id", (req, res) => {
  const r3 = db.prepare("DELETE FROM hcs WHERE id = ?").run(req.params.id);
  if (r3.changes === 0) {
    res.status(404).json({ error: "Quote not found" });
  } else {
    res.status(200).json({ message: "Quote deleted" });
  }
});

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
