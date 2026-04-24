import React from "react";

const SyncStatusInfo = ({ syncInfo }) => {
  if (!syncInfo || !syncInfo.updatedAt) {
    return (
      <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">
        อัปโหลดล่าสุด: <span className="font-medium text-slate-700">ยังไม่มีข้อมูล</span>
      </div>
    );
  }

  let lastUpdateStr = "วันที่ไม่ถูกต้อง";
  try {
    const dateObj = new Date(syncInfo.updatedAt);
    lastUpdateStr = dateObj.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (e) {
    console.error("Invalid sync date", e);
  }

  return (
    <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">
      อัปโหลดล่าสุด: <span className="font-medium text-slate-700">{lastUpdateStr}</span>
      {syncInfo.rowCount > 0 && (
        <span className="ml-1 text-emerald-600">({syncInfo.rowCount.toLocaleString()} แถว)</span>
      )}
    </div>
  );
};

export default SyncStatusInfo;
