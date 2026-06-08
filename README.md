# 🏪 บริหารจัดการชั้นวางสินค้า - ระบบหน้าเว็บ (Frontend BMR)

โปรเจคนี้คือระบบ **Frontend Web Application** สำหรับผู้ดูแลระบบ (Admin) และพนักงานหน้าร้าน (User) ในการจัดการข้อมูลสินค้า ชั้นวางสินค้า (Planogram) วิเคราะห์ยอดขาย และตรวจสอบสต็อกสินค้า

---

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

**Core Framework & Build Tool:**
*   **React (v19.1.1)** - ไลบรารีหลักสำหรับการสร้าง UI
*   **Vite (v7.1.7)** - Build tool และ Development Server ที่มีความเร็วสูง

**Styling & UI Components:**
*   **Tailwind CSS (v3.4)** - Utility-first CSS framework
*   **@mui/material** - Material UI Components
*   **@emotion/react & @emotion/styled** - ใช้ร่วมกับ MUI
*   **lucide-react & react-icons & @heroicons/react** - ไอคอนต่างๆ ในระบบ

**State Management & Routing:**
*   **Zustand (v5.0)** - จัดการ State กลางของแอปพลิเคชัน
*   **React Router DOM (v7.9)** - จัดการการนำทาง (Routing) ระหว่างหน้า

**Data Processing & Utils:**
*   **Axios** - สำหรับยิง HTTP Requests ติดต่อกับ Backend
*   **Lodash** - Utility functions สำหรับจัดการข้อมูล
*   **idb** - จัดการ IndexedDB สำหรับทำ Offline Caching
*   **Chart.js & react-chartjs-2** - สร้างกราฟวิเคราะห์ข้อมูล
*   **dayjs** - จัดการวันที่และเวลา

**Drag & Drop (Planogram):**
*   **@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/modifiers** - ระบบลากวางสินค้าบนชั้น

**Barcode / QR / OCR:**
*   **@zxing/browser & @zxing/library** - สำหรับอ่านบาร์โค้ดผ่านกล้อง
*   **tesseract.js** - สำหรับอ่านข้อความ (OCR) จากรูปภาพ

**File Export / Processing:**
*   **xlsx** - จัดการและอ่านไฟล์ Excel
*   **html2pdf.js** - แปลงหน้าเว็บเป็นไฟล์ PDF

---

## 📁 โครงสร้างโปรเจคหลัก (Project Structure)

```text
frontend-BMR/
├── public/                 # เก็บไฟล์ Static ทั่วไป เช่น รูปภาพ (images/), ไฟล์ _redirects
├── src/
│   ├── api/                # ตั้งค่าการเรียก API (เช่น การเซ็ตอัป Axios)
│   ├── app/                # การตั้งค่าแอปหลัก
│   ├── features/           # Components และ Pages แยกตาม Feature
│   │   ├── admin/          # หน้าสำหรับ Admin (เช่น จัดการสินค้า, อัปโหลด, วิเคราะห์)
│   │   ├── auth/           # ระบบ Login/Logout
│   │   └── user/           # หน้าสำหรับ User พนักงานสาขา
│   ├── routes/             # จัดการ Route และระบบ Protect Route (เช็คสิทธิ์)
│   ├── store/              # ไฟล์ Zustand stores สำหรับ State Management
│   │   ├── bmr_store.jsx
│   │   ├── dashboard_sales_store.jsx
│   │   ├── sales_store.jsx
│   │   ├── shelf_store.jsx
│   │   └── stock_meta_store.jsx
│   ├── utils/              # ฟังก์ชันตัวช่วยต่างๆ (Helpers)
│   ├── index.css           # สไตล์หลัก (Tailwind imports)
│   └── main.jsx            # จุดเริ่มต้นแอป (Entry point)
├── .env                    # (ไม่มีใน Git) ตัวแปรระบบ (Environment Variables)
├── package.json            # กำหนด Dependencies
└── vite.config.js          # (ถ้ามี) การตั้งค่า Vite
```

---

## 📚 เอกสารเพิ่มเติมในระบบ (System Documentation)

สำหรับการศึกษาและเข้าใจการทำงานเชิงลึกของโปรเจกต์ สามารถอ่านเอกสารประกอบเพิ่มเติมที่จัดทำขึ้นได้ตามรายละเอียดดังนี้:

*   **[สถาปัตยกรรมระบบ (System Architecture)](file:///c:/BrightMindRetail/brightmind_project/planogram_project/frontend-BMR/docs/ARCHITECTURE.md)** — รายละเอียดทางเทคนิคเกี่ยวกับ Domain-Driven Folder Layout, ระบบรักษาความปลอดภัยแบบ In-memory JWT Access Token & HttpOnly Cookies, กลไก Request Interceptor Queueing เมื่อ Token 401 และ Zustand Stores Optimistic Updates
*   **[Flow การใช้งานของ User และ Admin](file:///c:/BrightMindRetail/brightmind_project/planogram_project/frontend-BMR/docs/USER_ADMIN_FLOWS.md)** — แผนภาพและขั้นตอนการทำงานจำลองของพนักงานหน้าสาขา (User Mode: Scan, Add/Move/Delete request, Acknowledge) และผู้ดูแลระบบหลังบ้าน (Admin Mode: Decisions, Bulk approval, Template configuration, Analytics)
*   **[คู่มือระบบ POG Request](file:///c:/BrightMindRetail/brightmind_project/planogram_project/frontend-BMR/docs/POG_REQUEST_README.md)** — รายละเอียดข้อจำกัด เงื่อนไขการป้องกัน Bug ในกรณีส่งคำร้องขอขยับขยายสินค้าของสาขา
*   **[คู่มือระบบ Shelf Manager](file:///c:/BrightMindRetail/brightmind_project/planogram_project/frontend-BMR/docs/SHELF_MANAGER_README.md)** — วิธีการทำงานและรายละเอียดทางเทคนิคของหน้าจอการควบคุม Layout Grid ชั้นวางของแอดมิน

---

## 🛠️ การติดตั้งและรันโปรเจคเครื่องตัวเอง (Local Development)

### สิ่งที่ต้องเตรียม
*   **Node.js** (แนะนำเวอร์ชัน 18 หรือ 20 ขึ้นไป)
*   **Backend BMR** ต้องรันอยู่ (เพื่อให้ Frontend ยิง API ได้)
