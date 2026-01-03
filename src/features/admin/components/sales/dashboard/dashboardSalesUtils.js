// src/components/admin/dashboard/dashboardSalesUtils.js

// Date → YYYY-MM-DD (Local)
export const toLocalISO = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// "2025-12-06" → "06/12/2025"
export const formatDisplayDate = (isoStr) => {
  if (!isoStr) return "";
  const [y, m, d] = String(isoStr).split("-");
  if (!y || !m || !d) return isoStr;
  return `${d}/${m}/${y}`;
};

export const parseISO = (iso) => {
  const [y, m, d] = String(iso || "")
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
};

export const addMonths = (dateObj, deltaMonths) => {
  const d = new Date(dateObj.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + deltaMonths);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
};

export const addYears = (dateObj, deltaYears) => {
  const d = new Date(dateObj.getTime());
  d.setFullYear(d.getFullYear() + deltaYears);
  return d;
};

export const startOfMonthISO = (ref) =>
  toLocalISO(new Date(ref.getFullYear(), ref.getMonth(), 1));
export const endOfMonthISO = (ref) =>
  toLocalISO(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));

const quarterOf = (d) => Math.floor(d.getMonth() / 3) + 1;
export const quarterStart = (d) =>
  new Date(d.getFullYear(), (quarterOf(d) - 1) * 3, 1);
export const quarterEnd = (d) => new Date(d.getFullYear(), quarterOf(d) * 3, 0);

export const daysBetweenInclusive = (startISO, endISO) => {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!s || !e) return 0;
  const ms = 24 * 60 * 60 * 1000;
  const a = new Date(s);
  a.setHours(12, 0, 0, 0);
  const b = new Date(e);
  b.setHours(12, 0, 0, 0);
  const diff = Math.floor((b - a) / ms);
  return diff >= 0 ? diff + 1 : 0;
};

export const safeDiv = (a, b) => {
  const x = Number(a || 0);
  const y = Number(b || 0);
  return y ? x / y : 0;
};

export const fmtMoney = (v) =>
  Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtInt = (v) => Number(v || 0).toLocaleString();

export const hasCompareData = (dash) => {
  const s = dash?.summary;
  if (!s) return false;
  const total = Math.abs(Number(s.total_payment || 0));
  const bills = Math.abs(Number(s.bill_count || 0));
  const disc = Math.abs(Number(s.discount_sum || 0));
  const rounding = Math.abs(Number(s.rounding_sum || 0));
  return total + bills + disc + rounding > 0;
};

// normalize channel/method
export const normalizeChannel = (name, code) => {
  let n = String(name || code || "Unknown").trim();
  const lower = n.toLowerCase();
  if (!n || lower === "unknown") n = "หน้าร้าน";
  if (n === "หน้าบ้าน") n = "หน้าร้าน";
  return n;
};
export const normalizeMethod = (m) => {
  const mm = String(m || "").trim();
  if (!mm || mm.toLowerCase() === "unknown") return "Unknown";
  return mm;
};

// bill_date -> YYYY-MM-DD
export const dateKey = (v) => {
  if (!v) return "";
  const s = String(v);
  if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : toLocalISO(d);
};

export const clampISO = (dateStr, minDate, maxDate) => {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr);
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;
  if (min && d < min) return minDate;
  if (max && d > max) return maxDate;
  return toLocalISO(d);
};

export const isValidRange = (s, e) => {
  const sd = parseISO(s);
  const ed = parseISO(e);
  if (!sd || !ed) return false;
  return sd.getTime() <= ed.getTime();
};

/**
 * ✅ Engine: สร้างช่วง primary/compare ตาม mode
 * baseDate = "เมื่อวาน" (latest)
 */
export const getRangesByMode = ({ mode, start, end, baseDate }) => {
  const baseEndISO = toLocalISO(baseDate);

  if (mode === "diff_month") {
    const curStart = startOfMonthISO(baseDate);
    const curEnd = baseEndISO;

    const prevRef = addMonths(
      new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
      -1
    );
    const prevStart = startOfMonthISO(prevRef);
    const prevEnd = endOfMonthISO(prevRef);

    return {
      primary: { start: curStart, end: curEnd },
      compare: { start: prevStart, end: prevEnd },
    };
  }

  if (mode === "diff_quarter") {
    const qs = quarterStart(baseDate);
    const prevQs = addMonths(qs, -3);
    const prevQe = quarterEnd(prevQs);

    return {
      primary: { start: toLocalISO(qs), end: baseEndISO },
      compare: { start: toLocalISO(prevQs), end: toLocalISO(prevQe) },
    };
  }

  // diff_year
  const s = start;
  const e = end;

  const sDate = new Date(`${s}T00:00:00`);
  const eDate = new Date(`${e}T00:00:00`);
  const prevS = toLocalISO(addYears(sDate, -1));
  const prevE = toLocalISO(addYears(eDate, -1));

  return { primary: { start: s, end: e }, compare: { start: prevS, end: prevE } };
};

export const registerChart = async () => {
  const chart = await import("chart.js");
  chart.Chart.register(
    chart.CategoryScale,
    chart.LinearScale,
    chart.BarElement,
    chart.PointElement,
    chart.LineElement,
    chart.Tooltip,
    chart.Legend
  );
};

/* =========================
   ✅ SHIFT/UNSHIFT แบบไม่ clamp วัน (สำคัญมาก)
   - ทำให้กรณี 30 vs 31: จะได้ label แบบ YYYY-MM-31 และ current=0
========================= */
const pad2 = (n) => String(n).padStart(2, "0");

const shiftIsoByMonthsNoClamp = (iso, deltaMonths) => {
  const [ys, ms, ds] = String(iso || "").split("-");
  const y = parseInt(ys, 10);
  const m = parseInt(ms, 10);
  const d = parseInt(ds, 10);
  if (!y || !m || !d) return "";

  const total = (y * 12 + (m - 1)) + deltaMonths;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;

  return `${ny}-${pad2(nm)}-${pad2(d)}`; // ✅ ไม่ clamp d
};

const shiftIsoByYearsNoClamp = (iso, deltaYears) => {
  const [ys, ms, ds] = String(iso || "").split("-");
  const y = parseInt(ys, 10);
  const m = parseInt(ms, 10);
  const d = parseInt(ds, 10);
  if (!y || !m || !d) return "";
  return `${y + deltaYears}-${pad2(m)}-${pad2(d)}`; // ✅ ไม่ clamp d
};

const shiftISOByModeNoClamp = (iso, mode) => {
  if (!iso) return "";
  if (mode === "diff_month") return shiftIsoByMonthsNoClamp(iso, -1);
  if (mode === "diff_quarter") return shiftIsoByMonthsNoClamp(iso, -3);
  return shiftIsoByYearsNoClamp(iso, -1); // diff_year
};

const unshiftISOByModeNoClamp = (iso, mode) => {
  if (!iso) return "";
  if (mode === "diff_month") return shiftIsoByMonthsNoClamp(iso, +1);
  if (mode === "diff_quarter") return shiftIsoByMonthsNoClamp(iso, +3);
  return shiftIsoByYearsNoClamp(iso, +1); // diff_year
};

const shiftYmByMode = (ym, mode) => {
  if (!ym || ym.length < 7) return "";
  const iso = `${ym}-01`;
  const shifted = shiftISOByModeNoClamp(iso, mode);
  return shifted ? shifted.slice(0, 7) : "";
};

/**
 * ✅ Daily (union + เติม 0 + ไม่ตัด 31)
 * - ถ้า compare มีวันที่ 31 แต่ current เดือนนั้นไม่มี => label จะเป็น YYYY-MM-31 และ current=0
 * - compareDate แสดงเป็นวันที่จริงของฝั่ง compare (shift แบบไม่ clamp)
 */
export const buildDailyAligned = (primaryDash, compareDash, opts = {}) => {
  const { mode = "diff_month" } = opts || {};

  const toMap = (dash) => {
    const map = new Map(); // YYYY-MM-DD => {sales,bills}
    (dash?.salesByDate || [])
      .map((r) => ({
        d: dateKey(r.bill_date),
        sales: Number(r.total_payment || 0),
        bills: Number(r.sale_count || 0),
      }))
      .filter((x) => x.d)
      .forEach((x) => map.set(x.d, x));
    return map;
  };

  const pMap = toMap(primaryDash);
  const cMap = toMap(compareDash);

  // ✅ union labels: primary dates + (compare dates unshift ไปเป็น current-side แบบไม่ clamp)
  const fromCompareToCurrent = Array.from(cMap.keys())
    .map((cd) => unshiftISOByModeNoClamp(cd, mode))
    .filter(Boolean);

  const labelSet = new Set([...pMap.keys(), ...fromCompareToCurrent]);
  const labels = Array.from(labelSet).sort((a, b) => (a > b ? 1 : -1));

  const curSales = [];
  const curBills = [];
  const cmpSales = [];
  const cmpBills = [];
  const compareDates = [];
  const tableRows = [];

  for (const d of labels) {
    const pRec = pMap.get(d);
    const curS = pRec ? Number(pRec.sales || 0) : 0;
    const curB = pRec ? Number(pRec.bills || 0) : 0;

    const cd = shiftISOByModeNoClamp(d, mode); // target compare date (อาจเป็น YYYY-MM-31 ได้)
    const cRec = cd ? cMap.get(cd) : null;

    const cmpS = cRec ? Number(cRec.sales || 0) : 0;
    const cmpB = cRec ? Number(cRec.bills || 0) : 0;

    curSales.push(curS);
    curBills.push(curB);
    cmpSales.push(cmpS);
    cmpBills.push(cmpB);
    compareDates.push(cd || "");

    tableRows.push({
      date: d,
      compareDate: cd || "",
      curSales: curS,
      cmpSales: cmpS,
      curBills: curB,
      cmpBills: cmpB,
    });
  }

  return { labels, curSales, curBills, cmpSales, cmpBills, compareDates, tableRows };
};

/**
 * ✅ Monthly: align ตามเดือนที่ "ควรเทียบ" + tableRows
 */
export const buildMonthlyAligned = (primaryDash, compareDash, opts = {}) => {
  const { mode = "diff_month" } = opts || {};

  const aggMonthMap = (dash) => {
    const map = new Map(); // YYYY-MM => total
    (dash?.salesByDate || []).forEach((r) => {
      const d = dateKey(r.bill_date);
      if (!d) return;
      const ym = d.slice(0, 7);
      const sales = Number(r.total_payment || 0);
      map.set(ym, (map.get(ym) || 0) + sales);
    });
    return map;
  };

  const pMap = aggMonthMap(primaryDash);
  const cMap = aggMonthMap(compareDash);

  const labels = Array.from(pMap.keys()).sort((a, b) => (a > b ? 1 : -1));
  const curSales = labels.map((ym) => Number(pMap.get(ym) || 0));

  const targetCmpYm = labels.map((ym) => shiftYmByMode(ym, mode));
  const cmpSales = labels.map((_, i) => {
    const cym = targetCmpYm[i];
    if (!cym) return null;
    const v = cMap.get(cym);
    return v == null ? null : Number(v);
  });

  const cmpMonths = labels.map((_, i) => {
    const cym = targetCmpYm[i];
    if (!cym) return "";
    return cMap.has(cym) ? cym : "";
  });

  const tableRows = labels.map((ym, i) => ({
    ym,
    compareYm: cmpMonths[i] || "",
    curSales: curSales[i] ?? 0,
    cmpSales: cmpSales[i],
  }));

  return { labels, curSales, cmpSales, cmpMonths, tableRows };
};

export const aggregateBranches = (dash) => {
  const map = new Map();
  (dash?.salesByBranchDate || []).forEach((r) => {
    const code = String(r.branch_code || "");
    const name = String(r.branch_name || code || "Unknown");
    const key = code || name;
    const v = Number(r.total_payment || 0);

    const cur = map.get(key) || { branch_code: code, branch_name: name, total: 0 };
    cur.total += v;
    map.set(key, cur);
  });
  return Array.from(map.values());
};
