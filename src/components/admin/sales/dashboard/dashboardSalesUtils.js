// src/components/admin/dashboard/dashboardSalesUtils.js
import { useCallback, useEffect, useRef } from "react";

// ✅ helper แปลง Date → YYYY-MM-DD แบบใช้เวลา Local (กัน timezone เพี้ยน)
export const toLocalISODate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISODate(d);
};

// ✅ filter data จาก baseData ตามช่วงวันที่ที่เลือก + โหมดเปรียบเทียบ
export const filterDashboardData = (baseData, start, end, compareMode = "overview") => {
  if (!baseData) return null;

  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T23:59:59");

  let prevStartDate = null;
  let prevEndDate = null;

  if (compareMode === "range_yoy") {
    prevStartDate = new Date(startDate);
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);

    prevEndDate = new Date(endDate);
    prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
  }

  const inCurrentRange = (value) => {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    return d >= startDate && d <= endDate;
  };

  const inRange = (value) => {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;

    if (compareMode === "range_yoy" && prevStartDate && prevEndDate) {
      return (
        (d >= startDate && d <= endDate) ||
        (d >= prevStartDate && d <= prevEndDate)
      );
    }

    return d >= startDate && d <= endDate;
  };

  const allSalesRows = (baseData.salesByDate || []).filter((r) => inRange(r.bill_date));
  const salesByDate = allSalesRows;

  const salesByBranchDate = (baseData.salesByBranchDate || []).filter((r) => inRange(r.bill_date));
  const salesByChannelDate = (baseData.salesByChannelDate || []).filter((r) => inRange(r.bill_date));

  const salesByChannelYear = {};
  salesByChannelDate.forEach((r) => {
    if (!r.bill_date) return;
    const d = new Date(r.bill_date);
    if (Number.isNaN(d.getTime())) return;

    const year = d.getFullYear();

    let name = r.channel_name || r.channel_code || "Unknown";
    const lower = String(name || "").trim().toLowerCase();

    if (!name || lower === "unknown") name = "หน้าร้าน";
    else if (name === "หน้าบ้าน") name = "หน้าร้าน";

    const val = Number(r.total_payment || 0);

    if (!salesByChannelYear[year]) salesByChannelYear[year] = {};
    salesByChannelYear[year][name] = (salesByChannelYear[year][name] || 0) + val;
  });

  const branchMap = {};
  salesByBranchDate.forEach((r) => {
    const key = r.branch_name || r.branch_code || "-";
    const val = Number(r.total_payment || 0);
    branchMap[key] = (branchMap[key] || 0) + val;
  });
  const salesByBranch = Object.entries(branchMap).map(([branch_name, branch_sales]) => ({
    branch_name,
    branch_sales,
  }));

  const summaryRows =
    compareMode === "range_yoy"
      ? allSalesRows.filter((r) => inCurrentRange(r.bill_date))
      : allSalesRows;

  const total_payment = summaryRows.reduce((sum, r) => sum + Number(r.total_payment || 0), 0);
  const rounding_sum = summaryRows.reduce((sum, r) => sum + Number(r.rounding_sum || 0), 0);
  const discount_sum = summaryRows.reduce((sum, r) => sum + Number(r.discount_sum || 0), 0);

  const bill_count_total = summaryRows.reduce((sum, r) => sum + Number(r.bill_count || 0), 0);
  const sale_count_total = summaryRows.reduce((sum, r) => sum + Number(r.sale_count || 0), 0);

  const summary = {
    total_payment,
    rounding_sum,
    discount_sum,
    bill_count: sale_count_total,      // เฉพาะบิลขาย
    net_bill_count: bill_count_total,  // ขาย+คืน
  };

  return {
    summary,
    salesByDate,
    salesByBranchDate,
    salesByBranch,
    salesByChannelYear,
  };
};

// ✅ Hook: สลับโหมดแล้วปรับช่วงวันอัตโนมัติ
// - เข้า range_yoy: ปรับ start ให้อยู่ "ปีเดียวกับ end"
// - กลับ overview: คืนค่า start/end เดิม
export const useCompareModeSmart = ({
  start,
  end,
  setStart,
  setEnd,
  MIN_DATE,
  MAX_DATE,
  compareMode,
  setCompareMode,
}) => {
  const overviewRangeRef = useRef({ start: null, end: null });

  useEffect(() => {
    if (compareMode === "overview") {
      overviewRangeRef.current = { start, end };
    }
  }, [start, end, compareMode]);

  const clampISO = useCallback(
    (iso) => {
      if (!iso) return iso;
      const d = new Date(iso + "T00:00:00");
      if (Number.isNaN(d.getTime())) return iso;

      const min = MIN_DATE ? new Date(MIN_DATE + "T00:00:00") : null;
      const max = MAX_DATE ? new Date(MAX_DATE + "T00:00:00") : null;

      if (min && d < min) return MIN_DATE;
      if (max && d > max) return MAX_DATE;
      return toLocalISODate(d);
    },
    [MIN_DATE, MAX_DATE]
  );

  return useCallback(
    (nextMode) => {
      if (nextMode === compareMode) return;

      if (nextMode === "range_yoy") {
        overviewRangeRef.current = overviewRangeRef.current.start
          ? overviewRangeRef.current
          : { start, end };

        const endD = new Date(end + "T00:00:00");
        if (!Number.isNaN(endD.getTime())) {
          const endYear = endD.getFullYear();

          const parts = String(start || "").split("-");
          const sm = parts[1] || "01";
          const sd = parts[2] || "01";

          let newStart = `${endYear}-${sm}-${sd}`;

          if (new Date(newStart + "T00:00:00") > new Date(end + "T00:00:00")) {
            newStart = `${endYear}-01-01`;
          }

          setStart(clampISO(newStart));
        }

        setCompareMode("range_yoy");
        return;
      }

      const backup = overviewRangeRef.current;
      if (backup?.start && backup?.end) {
        setStart(backup.start);
        setEnd(backup.end);
      }
      setCompareMode("overview");
    },
    [compareMode, start, end, setStart, setEnd, setCompareMode, clampISO]
  );
};
