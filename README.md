# LabTrack — Laboratory Borrowing Management System

[![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-52.0-black.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(sql.js)-lightgrey.svg)](https://sqlite.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)

**LabTrack** is a mobile-first laboratory equipment borrowing and inventory management system engineered for educational and research engineering laboratories (UMTC Engineering Laboratories). It streamlines the equipment loan process, eliminates manual paper-based logs, tracks equipment condition across multi-item transactions, and enforces accountability through role-based access control.

---

##  Key Features

- **Authentication & Role-Based Access Control (RBAC):** Admin (laboratory custodian) and Assistant roles with protected staff management routes.
- **Home & Live Analytics Dashboard:** Real-time metrics on total laboratory assets, currently borrowed units, overdue loans, and quick return actions.
- **Equipment Inventory Catalog:** Search, category filtering, real-time availability status (*Available*, *Partial*, *Out*), asset-tag tracking, and specifications detail.
- **Multi-Step Borrowing Transaction Wizard:**
  - **Step 1 — Borrower Information:** Student/Faculty identification, college department, subject, schedule, purpose, and contact number.
  - **Step 2 — Equipment Selection:** Interactive quantity stepper, real-time stock validation, and multi-item cart.
  - **Step 3 — Duration & Dates:** Preset loan durations (Overnight, Standard, Extended), custom schedule selection, and notes.
  - **Step 4 — Review & Authorization:** Custodian approval, optional digital proof/photo upload, and generation of official transaction codes (`TXN-YYYY-XXX`).
- **Comprehensive Return Processing:** Check off returned items, assign condition grades (*1: Good*, *2: For Replacement*, *3: For Repair*, *4: Consumable*), log return remarks, and instantly restore inventory counts.
- **Staff Directory & Custodian Management:** View laboratory personnel, add staff members, toggle active/inactive status, and manage permissions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile Frontend** | React Native, Expo SDK 52, Expo Router v4, React Native Safe Area Context, Vector Icons |
| **Backend API** | Node.js, Express.js REST API, TypeScript, ts-node-dev |
| **Database** | SQLite (via `sql.js` WebAssembly engine with disk persistence to `labtrack.db`) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs password hashing |
| **Type Safety** | TypeScript (Strict Mode) across both Frontend and Backend |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Mobile Client (Expo / React Native)"]
        UI["Mobile App UI\n(Expo Router Screens)"]
        State["Custom Hooks & Services\n(useEquipment, useDashboard, useRecords, useStaff)"]
        API_Client["Axios / Fetch API Client\n(Bearer JWT Auth)"]
    end

    subgraph Server ["Backend (Node.js & Express REST API)"]
        Router["Express Router (/api)"]
        Middleware["Auth & Validator Middleware"]
        Controllers["Controllers\n(Borrow, Equipment, Staff, Dashboard)"]
        Repos["Repository Layer\n(borrowRepository, equipmentRepository, staffRepository)"]
    end

    subgraph Storage ["Database Layer"]
        DB["SQLite WASM (sql.js)\nlabtrack.db File Persistence"]
    end

    UI --> State
    State --> API_Client
    API_Client -- "HTTP / REST JSON" --> Router
    Router --> Middleware --> Controllers --> Repos --> DB
```

---

## 🗄️ Database Structure & ERD

The relational database uses **SQLite** stored persistently in `backend/labtrack.db`.

```mermaid
erDiagram
    USERS {
        TEXT id PK "UUID v4"
        TEXT username UK "Unique login username"
        TEXT password_hash "Bcrypt hashed password"
        TEXT role "admin | assistant"
        TEXT full_name "Full personnel name"
        TEXT email "Institutional email"
        INTEGER is_active "1 = Active, 0 = Inactive"
        TEXT created_at "ISO 8601 Timestamp"
    }

    EQUIPMENT {
        TEXT id PK "UUID v4"
        TEXT product_id "Asset Tag / Model SKU (e.g. EQ-001)"
        TEXT name "Item name"
        TEXT brand "Manufacturer (e.g. Fluke, Rigol)"
        TEXT model "Model number"
        TEXT description "Specifications & details"
        INTEGER total_quantity "Total lab inventory count"
        TEXT created_at "ISO 8601 Timestamp"
        TEXT updated_at "ISO 8601 Timestamp"
    }

    BORROW_RECORDS {
        TEXT id PK "UUID v4"
        TEXT transaction_code "Batch Code (e.g. TXN-2026-087)"
        TEXT equipment_id FK "References equipment.id"
        TEXT borrower_name "Borrower Full Name"
        TEXT borrower_id "Student / Employee ID"
        TEXT purpose "Course / Experiment / Project"
        TEXT borrow_date "Loan date (YYYY-MM-DD)"
        TEXT due_date "Due date (YYYY-MM-DD)"
        TEXT return_date "Actual return date (NULL if active)"
        TEXT status "borrowed | overdue | returned"
        TEXT notes "Department, course, instructor notes"
        TEXT authorized_by "Personnel who approved the loan"
        TEXT photo_proof "URI or base64 ID proof"
        INTEGER quantity "Units borrowed in this item row"
        TEXT return_remarks "Condition notes upon return"
        TEXT created_at "ISO 8601 Timestamp"
    }

    EQUIPMENT ||--o{ BORROW_RECORDS : "loaned under"
    USERS ||--o{ BORROW_RECORDS : "authorizes"
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun
- Expo Go app on your physical mobile phone, or Android Studio Emulator

### 1. Clone the Repository
```bash
git clone https://github.com/drei-cabal/LabTrack-Laboratory-Borrowing-Management-System.git
cd LabTrack-Laboratory-Borrowing-Management-System
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm install
npm --prefix ./backend install
npm --prefix ./frontend install
```

### 3. Start the Backend API Server
```bash
npm run backend
```
The REST API will initialize the SQLite database (`labtrack.db`), seed initial laboratory equipment and default staff accounts, and listen on `http://localhost:3001`.

### 4. Start the Mobile Frontend
```bash
npm run start
```
- Press `a` to open in Android Emulator.
- Press `w` to run in Web Browser.
- Scan the QR code using the **Expo Go** app on your physical mobile device.

> **Note for Physical Device Testing:**
> Set your computer's local IP address in `frontend/.env`:
> ```env
> EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3001/api
> ```

---

## 🧪 Default Test Credentials

| Full Name | Username | Password | Role |
| :--- | :--- | :--- | :--- |
| **Prof. Eduardo Cruz** | `admin.cruz` | `admin123` | **Admin** |
| **Karen Dela Cruz** | `k.delacruz` | `staff123` | **Assistant** |
| **Marco Villanueva** | `m.villanueva` | `staff123` | **Assistant** |

---

## 📦 Building Standalone APK

To generate an installable Android APK file:
```bash
cd frontend
npx eas-cli build -p android --profile preview
```
