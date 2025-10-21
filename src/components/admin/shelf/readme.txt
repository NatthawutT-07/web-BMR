src/
 ├─ api/
 │   ├─ home.js
 │   └─ Template.js
 ├─ components/
 │   └─ Shelf/
 │        ├─ ShelfManager.jsx        ← main file
 │        ├─ BranchSelector.jsx      ← เลือกสาขา
 │        ├─ ShelfFilter.jsx         ← filter checkbox
 │        ├─ ShelfCard.jsx           ← render shelf + rows
 │        ├─ ShelfTable.jsx          ← ตารางภายใน shelf
 │        └─ ShelfSummary.jsx        ← total shelf
 │        ├─ EditShelfModal.jsx      # โมดัลแก้ไขพร้อม drag & drop /add
 │        ├─ SortableItem.jsx        # ไอเท็มสำหรับลากใน Modal     /add
 ├─ hooks/
 │   └─ useShelfData.js
 ├─ store/
 │   └─ bmr_store.js
 └─ utils/
     └─ shelfUtils.js


EditShelfModal
isOpen: Boolean – ถ้า true จะแสดง modal

onClose: function – ปิด modal

onSave: function – ส่ง editedProducts กลับเมื่อกด save

shelfProducts: array – รายการสินค้าทั้งหมดใน shelf

shelfCode: string – รหัส shelf เช่น "W2"