# Health Cover Simulator


A full-stack CRUD web application simulating a private health insurance quote system. Users can create, read, update, and delete quote records. Each quote is calculated from cover type, hospital/extras tiers, applicant ages, Lifetime Health Cover (LHC) loading, the family upgrade fee, and the annual-payment discount.

## URL: 
```bash
   https://github.com/DeMinhDeRozan/ProjectZero
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | SQLite |
| Styling | Plain CSS |

---

## Requirements

- **Node.js v24 or higher** — the backend uses Node's built-in `node:sqlite` module (`DatabaseSync`), which is only available from Node.js v22 and works reliably from v24.
- **Linux-based OS recommended** for testing this project — compatibility with other operating systems is not guaranteed.

---

## Installation & Running

1. Clone the repository:
```bash
   git clone https://github.com/DeMinhDeRozan/ProjectZero.git
```

2. Move into the cloned repo:
```bash
   cd ProjectZero
```

3. Install dependencies:
```bash
   npm install
```

4. Start the backend (Express API):
```bash
   node server.js
```
   → Runs on **http://localhost:3001**

5. In a **second terminal** (still inside `ProjectZero`), start the frontend:
```bash
   npm run dev
```
   → Vite dev server runs on **http://127.0.0.1:5173**

---

## Database Setup

- The database is **SQLite**, created automatically on server start via `server.js`.
- On first run, `server.js` opens (or creates) `hcs.db` in the project root using `node:sqlite`.
- The database script is already wired into the backend, so **no manual setup step is required** — simply running `node server.js` initialises the schema.
- The schema is defined in **`init.sql`**.
- The table includes `CHECK` constraints to enforce valid cover types, cover history values, age range (18–100), and discount range (0–10), providing an extra layer of database-level validation.

---

## How the Quote Calculation Works

All pricing logic lives in `QuoteCalculator()` in `server.js`, keeping the calculation logic centralised in one place.

**1. Hospital premium per applicant**
Each applicant's hospital tier base price (`None`–`Gold`) is multiplied by `(1 + LHC loading)`.

**2. LHC loading (hospital only)**

| Cover history | Loading |
|---|---|
| `Yes` | 0% |
| `No`, age > 30 | `(age − 30) × 2%` |
| `No`, age ≤ 30 | 0% |
| `Not Sure` | 0% (warning shown) |

Loading is **never** applied to extras cover. This rule is stated explicitly in every quote via the required LHC statement:

> "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover."

**3. Extras premium**
Extras tier base price (`None`–`Premium`) × number of adults. Extras cover is never loaded.

**4. Monthly premium**
`hospital total + extras total + family upgrade fee (if Family)`

**5. Yearly premium before discount**
`monthly premium × 12`

**6. Yearly premium after discount** *(Yearly payment only)*
`yearly before discount × (1 − annual discount / 100)`
Monthly payers do not receive this discount.

The API returns both the numeric breakdown and a plain-English explanation string, so the frontend can display the hospital premium, extras premium, each applicant's LHC loading %, warnings, the family fee (if applicable), and the final total.

---

## How Family Cover Is Calculated

- Family cover counts **2 adults** (same as Couple) for hospital and extras pricing — children are not priced individually.
- A flat **$30/month family upgrade fee** is added automatically to the monthly premium whenever `cover_type = "Family"`. The user does not enter this fee manually.
- LHC loading is still calculated **per adult** (Applicant 1 and Applicant 2), exactly as it is for Couple cover — the family fee is a separate flat add-on, unrelated to loading.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quote` | Create a new quote |
| `GET` | `/api/quote` | List all quotes |
| `GET` | `/api/quote/:id` | Get one quote with calculated price breakdown |
| `PUT` | `/api/quote/:id` | Update an existing quote |
| `DELETE` | `/api/quote/:id` | Delete a quote |

---

## Validation

Frontend (`App.jsx`) and backend (`server.js`) both run the same `checkQuoteData()` checks before a quote is created, updated, or calculated:

- Customer name is required and must not contain digits.
- Cover type must be one of `Single` / `Couple` / `Family`.
- Applicant 1 age is required and must be a number 18–100.
- Applicant 1 cover history must be `Yes` / `No` / `Not Sure`.
- For Couple/Family: Applicant 2 age (18–100) and cover history are also required.
- Hospital and extras cover levels must be valid tier names.
- Payment frequency must be `Monthly` or `Yearly`.
- Annual discount (0–10%) is required and validated only when payment frequency is `Yearly`.
- Backend validation additionally guards the database layer with `CHECK` constraints, and wraps all inserts/updates in try/catch so invalid or malformed requests return a `400` JSON error instead of crashing the server (`500`).


---

## AI Use Statement

- **Tool used:** Claude / Gemini
- **What it helped with:** Explaining Node's built-in `node:sqlite` API, debugging Express route/CORS setup, and reviewing/wording this README.
- **What I personally checked/implemented:** I wrote and tested the `QuoteCalculator()` pricing logic myself and manually verified it by writing it down to paper  before relying on it. I also implemented and tested all CRUD endpoints and the React form/validation logic myself.
- **One decision I made myself:** Choosing to calculate the quote breakdown at read-time (`GET /api/quote/:id`) rather than storing the calculated premium in the database, so pricing logic lives in a single place and always reflects the current rules — even if a quote's raw inputs are edited later.

---

## Known Limitation

The API has no authentication or authorization layer — any client can call the `POST`, `PUT`, and `DELETE` endpoints directly without logging in, meaning anyone with the API URL can create, edit, or delete quotes. In practice, these endpoints need to be protected to prevent unauthorized access to sensitive data.
