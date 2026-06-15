# Frontend BMR

เว็บสำหรับบริหาร Planogram ของ BrightMind Retail เชื่อมต่อกับ `backend-BMR` รองรับผู้ใช้ 2 กลุ่ม:

- Admin: dashboard, จัดการชั้นวาง, อัปโหลดข้อมูล, อนุมัติ POG และจัดการผู้ใช้/สาขา
- Branch user: ดูผังสินค้า, ค้นหา/สแกนบาร์โค้ด, ส่งคำขอเปลี่ยน POG และยืนยันการจัดชั้น

## เทคโนโลยีหลัก

- React 19
- Vite 7
- React Router 7
- Zustand
- Tailwind CSS และ Material UI
- Axios
- DnD Kit
- Chart.js
- ZXing สำหรับสแกนบาร์โค้ด
- XLSX สำหรับจัดการไฟล์ Excel

## สิ่งที่ต้องติดตั้ง

- Node.js `20.19+` หรือ `22.12+` ตามข้อกำหนดของ Vite 7
- npm
- `backend-BMR` ที่รันและเชื่อมต่อฐานข้อมูลได้

ตรวจสอบเวอร์ชัน:

```powershell
node --version
npm --version
```

## เริ่มต้นใช้งาน

```powershell
cd frontend-BMR
npm ci
```

สร้างไฟล์ `.env` ที่ root ของ `frontend-BMR`:

```dotenv
VITE_API_URL=http://localhost:5001
```

ค่า `VITE_API_URL` ต้องเป็น base URL ของ backend โดยไม่ต่อท้าย `/api` เพราะ Axios instance จะเติม `/api` ให้เอง

รัน development server:

```powershell
npm run dev
```

เปิด `http://localhost:5173`

ลำดับเปิดระบบสำหรับ local:

1. เปิด PostgreSQL
2. เปิด backend ที่ port `5001`
3. เปิด frontend ที่ port `5173`
4. ตรวจ `http://localhost:5001/health`
5. login ผ่านหน้า `/`

## คำสั่งที่ใช้บ่อย

```powershell
npm run dev       # Vite development server
npm run build     # สร้าง production bundle ใน dist/
npm run lint      # ตรวจ ESLint
npm run preview   # preview production build ที่ port 4173
```

ก่อนส่งขึ้น production ควรรันอย่างน้อย:

```powershell
npm run lint
npm run build
```


## โครงสร้างโปรเจกต์

```text
frontend-BMR/
|-- public/                    # static files, branch images, hosting headers/redirects
|-- src/
|   |-- api/                   # functions เรียก backend
|   |-- app/                   # App และ route definitions
|   |-- features/
|   |   |-- admin/             # หน้าและ component ของ admin
|   |   |-- auth/              # login
|   |   `-- user/              # หน้าและ component ของสาขา
|   |-- routes/                # route guards
|   |-- store/                 # Zustand stores
|   |-- utils/                 # Axios instance, logger และ shelf helpers
|   |-- index.css
|   `-- main.jsx
|-- vite.config.js
|-- tailwind.config.js
`-- package.json
```

## Routes

Routes ถูกกำหนดใน `src/app/AppRoutes.jsx`

- `/`: หน้า login
- `/sys-ahFvi1hmPw3iKCn`: admin dashboard
- `/xY7zA3bC9d/:storecode`: หน้าสาขา

Admin subroutes ใช้ path แบบ obfuscated และ menu ต้องอ้าง path ชุดเดียวกัน หากเปลี่ยน route ให้ตรวจทั้ง `AppRoutes.jsx`, sidebar และ route guards

## Authentication

จุดศูนย์กลางอยู่ที่:

- `src/store/bmr_store.jsx`
- `src/utils/axios.js`
- `src/routes/ProtectRouteAdmin.jsx`
- `src/routes/ProtectRouteUser.jsx`
- `src/routes/ProtectGuest.jsx`

พฤติกรรมสำคัญ:

- access token อยู่ใน Zustand memory และไม่ถูก persist
- refresh token อยู่ใน HttpOnly cookie จาก backend
- `storecodeHint` เท่านั้นที่ถูก persist ใน localStorage
- Axios ส่ง `withCredentials: true`
- เมื่อ access token หมดอายุ ระบบจะ queue request ระหว่าง refresh token
- CSRF token อ่านจาก cookie `csrfToken` และส่งเป็น `x-csrf-token`
- logout ล้าง localStorage และ IndexedDB ชื่อ `dashboardDataDB`

ห้ามเปลี่ยน cookie, CORS หรือ Axios credentials เพียงฝั่งเดียว ต้องตรวจ backend และ production domain พร้อมกัน

## Feature สำคัญ

Admin:

- Dashboard และ Shelf Dashboard
- จัดการ Shelf Template/SKU ด้วย drag and drop
- Upload และ clear ข้อมูลแต่ละชุด
- ตรวจและอนุมัติ POG Request
- ตรวจสถานะ acknowledgment ของสาขา
- จัดการ user และ branch

Branch user:

- ดูผังชั้นวางตาม `storecode`
- ค้นหาและสแกน barcode
- ส่ง/ยกเลิก POG Request
- ลงทะเบียนสินค้าเข้าชั้น
- รับทราบการเปลี่ยนผัง

ชนิดไฟล์ upload กำหนดใน `src/features/admin/components/upload/uploadConfig.js` และ API อยู่ใน `src/api/admin/upload.jsx`

## Production Build และ Deploy

สร้าง production bundle:

```powershell
npm ci
npm run build
```

ไฟล์ที่ deploy อยู่ใน `dist/`

ตัวอย่าง production environment:

```dotenv
VITE_API_URL=https://api.example.com
```

Vite ฝังค่า environment ตอน build ดังนั้นเมื่อเปลี่ยน `VITE_API_URL` ต้อง build ใหม่

ข้อกำหนดของ hosting:

- ให้ทุก route ที่ไม่ใช่ static asset fallback ไป `index.html`
- เปิด HTTPS
- อนุญาต frontend origin ใน CORS ของ backend
- ส่งไฟล์ใน `public/_headers` และ `public/_redirects` ไปกับ build
- cache hashed assets ได้ยาว แต่ไม่ควร cache `index.html`

Production ปัจจุบันของ backend อนุญาต origin:

- `https://bmrpog.com`
- `https://hq.bmrpog.com`

หาก frontend อยู่คนละ site กับ API ระบบ cookie ต้องทำงานผ่าน HTTPS และ backend ต้องคง `SameSite=None; Secure`

## Checklist ทดสอบก่อนส่งมอบ

- `npm run lint` และ `npm run build`
- เปิดหน้า login และตรวจรายการสาขา
- login ด้วย admin และ branch user
- refresh หน้าย่อยโดยตรงแล้วไม่เกิด 404
- ทดสอบ token refresh หลัง reload browser
- ทดสอบ upload ไฟล์ตัวอย่างและดู sync status
- ทดสอบแก้ shelf และ POG request ตั้งแต่ส่งคำขอจน acknowledgment
- ทดสอบกล้อง/สแกน barcode บนอุปกรณ์จริงผ่าน HTTPS
- ตรวจ dashboard หลัง backend import ข้อมูล


