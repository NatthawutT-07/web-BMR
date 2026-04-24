import React from "react";

const UploadProgressOverlay = ({ uploadInfo, progress, serverProgress }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-[92%] max-w-md rounded-xl bg-white p-5 shadow-xl border">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <div>
            <div className="text-sm font-semibold text-slate-800">กำลังอัปโหลดไฟล์</div>
            <div className="text-xs text-slate-500">
              {uploadInfo.label || "Upload"}{" "}
              {uploadInfo.total > 0 ? `(${uploadInfo.current}/${uploadInfo.total})` : ""}
            </div>
          </div>
        </div>
        
        {uploadInfo.fileName && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {uploadInfo.fileName}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {/* Current File Progress */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>ไฟล์นี้ (อัปโหลด)</span>
              <span className="tabular-nums">{progress.filePercent}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress.filePercent}%` }}
              />
            </div>
          </div>

          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>อัปโหลดทั้งหมด</span>
              <span className="tabular-nums">{progress.overallPercent}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress.overallPercent}%` }}
              />
            </div>
          </div>

          {/* Server Side Progress */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>ประมวลผลบนเซิร์ฟเวอร์</span>
              <span className="tabular-nums">{serverProgress.percent}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${serverProgress.percent}%` }}
              />
            </div>
            {serverProgress.message && (
              <div className="mt-1 text-[11px] text-slate-500">{serverProgress.message}</div>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            กรุณารอจนกว่าการอัปโหลดจะเสร็จ เพื่อป้องกันข้อมูลไม่ครบ
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProgressOverlay;
