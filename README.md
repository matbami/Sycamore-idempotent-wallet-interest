# Sycamore Wallet & Interest Service

A robust Fintech backend implementation featuring a secure wallet transfer system with idempotency protection and a high-precision daily interest accumulator.

## 🚀 Overview

This project addresses two critical Fintech challenges:
1.  **The Idempotent Wallet:** A `/transfer` system using Redis-backed idempotency and PostgreSQL transactions to prevent double-spending and race conditions.
2.  **The Interest Accumulator:** A service calculating daily interest at a **27.5% per annum** rate, utilizing fixed-point math to ensure 100% precision.

---

## 🛠 Tech Stack

* **Runtime:** Node.js (v18+)
* **Language:** TypeScript
* **Framework:** Express.js
* **ORM:** Sequelize (PostgreSQL)
* **Cache:** Redis (for Idempotency locking)
* **Testing:** Jest
* **Math:** Big.js (Fixed-point arithmetic)

---

## 🏛 Architectural Choices

### 1. Atomic Transactions & Race Conditions
To prevent money from "disappearing" or being double-spent during concurrent requests:
* **Database Transactions:** All balance updates and ledger entries are wrapped in a Sequelize transaction.
* **Row-Level Locking:** We utilize `SELECT FOR UPDATE` logic during transfers to ensure that if two processes attempt to debit the same wallet, they are queued sequentially.

### 2. Idempotency Strategy
A "double-tap" from a client should never result in two debits.
* **Process:** The system checks a Redis-backed `idempotencyKey`. If it exists, the request is rejected as a duplicate.
* **Logging:** A `TransactionLog` entry is created with a `PENDING` state *before* the transaction begins, ensuring we have a record of every attempted disbursement.

### 3. Financial Precision
Standard JavaScript floats are avoided for all financial math.
* **Database:** We use `DECIMAL(20, 10)` columns to prevent rounding errors at the storage level.
* **Application:** We use `Big.js` for calculations, ensuring that the 27.5% APR is divided accurately across 365 or 366 days without precision loss.

---

## 📁 Database Schema



* **Wallets:** Tracks `balance`, `currency`, and `accruedInterest`.
* **TransactionLogs:** Audit trail for transfers, storing `idempotencyKey` and `status` (`PENDING`, `SUCCESS`, `FAILED`).
* **InterestLedger:** Records every specific interest accrual event for auditing.

---

## 🚦 Getting Started

### Prerequisites
* Node.js v18+
* PostgreSQL
* Redis

### Installation
1.  **Clone the repository:**
    ```bash
    git clone <your-repo-link>
    cd sycamore-test
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Setup:**
    Create a `.env` file:
    ```env
    DB_USERNAME=postgres
    DB_PASSWORD=your_password
    DB_NAME=sycamore_db
    DB_HOST=127.0.0.1
    REDIS_URL=redis://localhost:6379
    NODE_ENV=test
    ```
4.  **Run Migrations:**
    ```bash
    npx sequelize-cli db:migrate
    ```

    ```bash
    NODE_ENV=test npx sequelize-cli db:migrate
    ```


---

## 🧪 Testing

The test suite is designed to prove math accuracy and system resilience.

```bash
# Run tests
npm test
```