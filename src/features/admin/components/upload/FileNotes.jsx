import React from "react";

const FileNotes = ({ fileType, loading, actions }) => {
  const { onClearTemplate, onClearSku, onClearStock, onClearMinMax } = actions;

  switch (fileType) {
    case "Template":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (POG Shelf):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ระบบจะทำการ <strong className="font-semibold">อัปเดตและเพิ่มข้อมูลใหม่</strong> ตามสาขาที่มีในไฟล์</li>
            <li>ข้อมูลชั้นวางใดในสาขานั้นๆ ที่มีในระบบแต่ <strong className="font-semibold text-rose-600">ไม่มีในไฟล์ จะถูกลบทิ้งทันที</strong> (Full Sync)</li>
            <li>ข้อมูลสาขาที่ไม่ได้อยู่ในไฟล์อัปโหลด จะไม่ได้รับผลกระทบใดๆ</li>
          </ul>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onClearTemplate}
              disabled={loading}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              เคลียร์ข้อมูล POG Shelf ทั้งหมด
            </button>
          </div>
        </div>
      );

    case "SKU":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (POG SKU):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ระบบจะทำงานแบบ <strong className="font-semibold">เพิ่มใหม่และอัปเดตทับเท่านั้น (ไม่มีการลบข้อมูลสินค้าเดิมทิ้ง)</strong></li>
            <li>หาก <strong className="font-semibold">รหัสสาขาและรหัสสินค้า</strong> ตรงกับในระบบ จะทำการอัปเดตตำแหน่งใหม่ (รหัสชั้นวาง, แถว, ลำดับ)</li>
            <li>หากในไฟล์มีข้อมูลที่ <strong className="font-semibold text-rose-600">รหัสสาขาและรหัสสินค้าซ้ำกันเอง</strong> ระบบจะแจ้ง Error ให้แก้ไขก่อนอัปโหลด</li>
          </ul>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onClearSku}
              disabled={loading}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              เคลียร์ข้อมูล POG SKU ทั้งหมด
            </button>
          </div>
        </div>
      );

    case "withdraw":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (Withdraw):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ดึงเฉพาะข้อมูลที่มี <strong className="font-semibold">สถานะเอกสาร "อนุมัติแล้ว"</strong> และ <strong className="font-semibold">เหตุผล ไม่ใช่ "เบิกเพื่อขาย"</strong></li>
            <li>ทำงานแบบ <strong className="font-semibold">เพิ่มข้อมูลใหม่และอัปเดต</strong> (อิงจากเลขเอกสาร, รหัสสาขา, สินค้า, จำนวน, มูลค่า)</li>
            <li>ข้อมูลซ้ำซ้อนในไฟล์ จะถูกกรองออกอัตโนมัติ</li>
          </ul>
        </div>
      );

    case "stock":
      return (
        <div className="mb-4 text-sm text-amber-800 bg-amber-50 p-3 rounded-md border border-amber-200">
          <strong className="font-semibold text-amber-700">หมายเหตุการอัปโหลด (Stock):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-amber-800">
            <li><strong className="font-semibold text-rose-600">คำเตือน:</strong> ข้อมูล Stock เดิมในระบบจะถูก <strong className="font-semibold">ลบทิ้งทั้งหมด (Truncate)</strong> ก่อนนำเข้าข้อมูลชุดใหม่</li>
            <li>ข้อมูลในไฟล์ใหม่ จะกลายเป็นข้อมูล Stock ปัจจุบันของทั้งระบบ</li>
          </ul>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onClearStock}
              disabled={loading}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              เคลียร์ข้อมูล Stock ทั้งหมด
            </button>
          </div>
        </div>
      );

    case "minMax":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (ItemMinMax):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ระบบทำงานแบบ <strong className="font-semibold">เพิ่มข้อมูลใหม่และอัปเดตทับข้อมูลเดิม</strong> (ไม่มีการลบข้อมูลทิ้ง)</li>
            <li>ใช้รหัสสาขาและรหัสสินค้า เป็นตัวตรวจสอบ หากตรงกันจะอัปเดตค่า Min/Max ใหม่</li>
          </ul>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onClearMinMax}
              disabled={loading}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              เคลียร์ข้อมูล ItemMinMax ทั้งหมด
            </button>
          </div>
        </div>
      );

    case "masterItem":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (MasterItem):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ระบบทำงานแบบ <strong className="font-semibold">เพิ่มสินค้าใหม่และอัปเดตข้อมูลสินค้าเดิม</strong> (ไม่มีการลบทิ้ง)</li>
            <li>หากข้อมูลไม่มีการเปลี่ยนแปลงจากในระบบ จะทำการข้าม(Skip) ไปอัตโนมัติเพื่อความรวดเร็ว</li>
          </ul>
        </div>
      );

    case "bill":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (Bill):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ระบบจะข้ามเลขที่บิลที่มีอยู่แล้วในระบบ (กันบิลซ้ำ)</li>
            <li><strong className="font-semibold">เพิ่มข้อมูลใหม่โดยอัตโนมัติ:</strong> หากพบรหัสสาขา, ช่องทางการขาย, สินค้า, หรือลูกค้าใหม่ในไฟล์ จะถูกสร้างขึ้นใหม่อัตโนมัติ</li>
          </ul>
        </div>
      );

    case "si":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (Order SI):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ทำงานแบบ <strong className="font-semibold">เพิ่มข้อมูลใหม่เท่านั้น</strong></li>
            <li>ระบบจะข้ามข้อมูลที่ซ้ำกัน (สาขา + เลขที่ SI + รหัสสินค้า + บาร์โค้ด ตรงกัน) โดยไม่เกิด Error</li>
          </ul>
        </div>
      );

    case "gourmet":
      return (
        <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
          <strong className="font-semibold">หมายเหตุการอัปโหลด (Gourmet):</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
            <li>ทำงานแบบ <strong className="font-semibold">เพิ่มยอดขายใหม่</strong> (วันที่, สาขา, สินค้า, จำนวน)</li>
            <li>หากเจอรายการยอดขายที่ซ้ำกันในระบบ จะทำการข้าม(Skip) ข้อมูลนั้นไปอัตโนมัติ</li>
          </ul>
        </div>
      );

    default:
      return null;
  }
};

export default FileNotes;
