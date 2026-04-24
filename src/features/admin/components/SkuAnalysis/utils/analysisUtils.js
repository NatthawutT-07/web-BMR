export const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

export const fmtDec = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const monthLabel = (m) => {
    const [y, mo] = m.split("-");
    const names = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${names[parseInt(mo)]} ${parseInt(y) + 543 - 2500}`;
};
