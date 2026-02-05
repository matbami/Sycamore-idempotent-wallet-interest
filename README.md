# Sycamore Wallet & Interest Service

A robust Fintech backend implementation featuring a secure wallet transfer system with idempotency protection and a high-precision daily interest accumulator.

---

##  Overview

This project addresses two critical Fintech challenges:

1. **The Idempotent Wallet:** A `/transfer` system using Redis-backed idempotency and PostgreSQL transactions to prevent double-spending and race conditions.
2. **The Interest Accumulator:** A service calculating daily interest at a **27.5% per annum** rate, utilizing fixed-point math to ensure 100% precision.

---

##  Tech Stack

* **Runtime:** Node.js (v18+)
* **Language:** TypeScript
* **Framework:** Express.js
* **ORM:** Sequelize (PostgreSQL)
* **Cache:** Redis (for Idempotency locking)
* **Testing:** Jest
* **Math:** Big.js (Fixed-point arithmetic)

---

## 🏗 Architectural Choices

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

## Database Schema

* **Wallets:** Tracks `balance`, `currency`, and `accruedInterest`.
* **TransactionLogs:** Audit trail for transfers, storing `idempotencyKey` and `status` (`PENDING`, `SUCCESS`, `FAILED`).
* **InterestLedger:** Records every specific interest accrual event for auditing.

---

##  Getting Started

### Prerequisites

* Node.js v18+
* PostgreSQL
* Redis

### Installation

1. **Clone the repository:**
```bash
   git clone <your-repo-link>
   cd sycamore-test
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Environment Setup:**
   
   Create a `.env` file:
```env
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=sycamore_db
   DB_HOST=127.0.0.1
   REDIS_URL=redis://localhost:6379
   NODE_ENV=test
```

4. **Run Migrations:**
```bash
   npx sequelize-cli db:migrate
```

5. **Seed Data:**
```bash
   npx sequelize-cli db:seed:all
```

---

##  Testing

The test suite is designed to prove math accuracy and system resilience.

### Setup Test Database

Make sure all the test credentials for your test DB are filled in the `.env`:
```env
DB_TEST_USER=
DB_TEST_PASSWORD=
DB_TEST_NAME=
DB_TEST_HOST=
DB_TEST_PORT=
```

Then run:
```bash
NODE_ENV=test npx sequelize-cli db:migrate
```

### Run Tests
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

##  Test Coverage

This project includes a Jest coverage report.

After running:
```bash
npm run test:coverage
```

A detailed HTML report is generated in:
```
coverage/lcov-report/index.html
```

The report shows statement, branch, function, and line coverage for all core services.

---

##  Transfer Endpoint – Sample Request Bodies

This section provides sample request payloads to test the `/transfer` endpoint across all required scenarios: successful transfers, idempotency protection, validation failures, and edge cases.

###  Endpoint
```http
POST /api/v1/transfer
```

---

###  Successful Transfer
```json
{
  "senderWalletId": "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
  "recipientWalletId": "3b8a1f5e-7d3c-4f21-9c1d-2e6a7b9f4c12",
  "amount": "10000",
  "idempotencyKey": "transfer-001"
}
```

**Expected Behavior:**
- Sender wallet is debited
- Recipient wallet is credited
- TransactionLog status is set to `SUCCESS`

---

###  Idempotency Test

Send the exact same request using the same `idempotencyKey`:
```json
{
  "senderWalletId": "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
  "recipientWalletId": "3b8a1f5e-7d3c-4f21-9c1d-2e6a7b9f4c12",
  "amount": "10000",
  "idempotencyKey": "transfer-001"
}
```

**Expected Behavior:**
- No additional debit occurs
- Existing transaction result is returned
- Prevents double-spending from client retries

---

###  Insufficient Balance
```json
{
  "senderWalletId": "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
  "recipientWalletId": "3b8a1f5e-7d3c-4f21-9c1d-2e6a7b9f4c12",
  "amount": "100000000",
  "idempotencyKey": "transfer-002"
}
```

**Expected Behavior:**
- Transaction is rolled back
- No wallet balance is modified
- TransactionLog status is set to `FAILED`
- Failure reason is recorded

---

### Invalid Wallet ID
```json
{
  "senderWalletId": "00000000-0000-0000-0000-000000000000",
  "recipientWalletId": "3b8a1f5e-7d3c-4f21-9c1d-2e6a7b9f4c12",
  "amount": "5000",
  "idempotencyKey": "transfer-003"
}
```

**Expected Behavior:**
- Request fails with a domain or validation error
- No database mutation occurs

---

###  Self Transfer (Sender Equals Recipient)
```json
{
  "senderWalletId": "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
  "recipientWalletId": "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
  "amount": "1000",
  "idempotencyKey": "transfer-004"
}
```

**Expected Behavior:**
- Request is rejected
- Prevents meaningless or abusive transactions

---

###  Missing Required Fields (Validation Failure)
```json
{
  "senderWalletId": "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
  "amount": "1000"
}
```

**Expected Behavior:**
- Validation error (HTTP 400)
- No transaction is attempted

---