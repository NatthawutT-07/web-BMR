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

## 🛠️ การติดตั้งและรันโปรเจคเครื่องตัวเอง (Local Development)

### สิ่งที่ต้องเตรียม
*   **Node.js** (แนะนำเวอร์ชัน 18 หรือ 20 ขึ้นไป)
*   **Backend BMR** ต้องรันอยู่ (เพื่อให้ Frontend ยิง API ได้)

### ขั้นตอนการรัน

1.  **เปิด Terminal และเข้าไปที่โฟลเดอร์ `frontend-BMR`:**
    ```bash
    cd c:\BrightMindRetail\brightmind_project\planogram_project\frontend-BMR
    ```

2.  **ติดตั้งไลบรารีทั้งหมด:**
    ```bash
    npm install
    ```

3.  **ตั้งค่า Environment:**
    สร้างไฟล์ `.env` ที่ root ของโปรเจค (หรือเช็คไฟล์ `.env.development` / `.env.local`) และกำหนดค่า URL ของ Backend:
    ```env
    VITE_API_URL=http://localhost:5001/api
    ```

4.  **เปิด Development Server:**
    ```bash
    npm run dev
    ```
    เซิร์ฟเวอร์จะรันขึ้นมา (มักจะอยู่ที่ `http://localhost:5173` หรือตามที่ Terminal แจ้ง)

---

## 💻 Script คำสั่งที่สำคัญ

*   `npm run dev` : เปิดเซิร์ฟเวอร์สำหรับการพัฒนา (รองรับ Hot-reload)
*   `npm run build` : สร้างไฟล์ Production-ready (Minified) ไปไว้ที่โฟลเดอร์ `dist/`
*   `npm run preview` : รันเซิร์ฟเวอร์จำลองเพื่อทดสอบไฟล์ที่ได้จากการ Build ก่อนนำขึ้นโฮสต์จริง
*   `npm run lint` : ตรวจสอบข้อผิดพลาดของโค้ดด้วย ESLint

---

## 🌐 การนำระบบขึ้นใช้งานจริง (Deployment)

1.  รันคำสั่งเพื่อสร้าง Build:
    ```bash
    npm run build
    ```
2.  ไฟล์ทั้งหมดจะถูกสร้างในโฟลเดอร์ `dist/`
3.  นำไฟล์ในโฟลเดอร์ `dist/` ไปอัปโหลดขึ้นโฮสติ้งที่รองรับ Static Site (เช่น Netlify, Vercel, Firebase Pages, หรือเซิร์ฟเวอร์ Nginx ของคุณเอง)
4.  *(สำคัญ)* อย่าลืมตั้งค่า Server ให้ชี้ทุก Path กลับมาที่ `index.html` เสมอ เพื่อให้ React Router ทำงานได้ถูกต้อง (เช่น ใน Netlify จะใช้ไฟล์ `_redirects` ที่เตรียมไว้ในโฟลเดอร์ `public/`)
