import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { monthLabel } from "../utils/analysisUtils";

export const useAnalysisExport = (mode, displayRows, summaryMonths, totals, startDate, endDate) => {
    const exportToExcel = () => {
        if (!displayRows.length) {
            toast.warn("ไม่มีข้อมูลสำหรับ Export");
            return;
        }

        let exportData;
        let sheetName;
        let fileName;

        if (mode === "store") {
            exportData = displayRows.map(row => {
                const obj = {
                    "สาขา": row.branch_code,
                    "ชื่อสาขา": row.branch_name,
                    "รหัสสินค้า": row.product_code,
                    "ชื่อสินค้า": row.product_name,
                    "แบรนด์": row.brand,
                    "ราคาขาย": row.rsp,
                    "Shelf Life": row.shelfLife || "",
                    "Min": row.minStore ?? "",
                    "Max": row.maxStore ?? "",
                    "Pack": row.packOrder ?? "",
                    "Stock": row.stock_quantity,
                };
                for (const m of summaryMonths) {
                    obj[`${monthLabel(m)} QTY Sale`] = row.months?.[m]?.sale_quantity || 0;
                    obj[`${monthLabel(m)} Actual Sale`] = row.months?.[m]?.net_sales || 0;
                    obj[`${monthLabel(m)} QTY W`] = row.months?.[m]?.withdraw_quantity || 0;
                    obj[`${monthLabel(m)} Actual W`] = row.months?.[m]?.withdraw_value || 0;
                    obj[`${monthLabel(m)} SI`] = row.months?.[m]?.si_quantity || 0;
                    obj[`${monthLabel(m)} SIA`] = row.months?.[m]?.sia_quantity || 0;
                }
                obj["รวมทั้งหมด QTY Sale"] = row.sale_quantity;
                obj["รวมทั้งหมด Actual Sale"] = row.net_sales;
                obj["รวมทั้งหมด QTY W"] = row.withdraw_quantity;
                obj["รวมทั้งหมด Actual W"] = row.withdraw_value;
                obj["รวมทั้งหมด SI"] = row.si_quantity;
                obj["รวมทั้งหมด SIA"] = row.sia_quantity;
                return obj;
            });

            const totalRow = {
                "สาขา": "รวม", "ชื่อสาขา": "", "รหัสสินค้า": "", "ชื่อสินค้า": "",
                "แบรนด์": "", "ราคาขาย": "", "Shelf Life": "", "Min": "", "Max": "", "Pack": "",
                "Stock": totals.stock_quantity,
            };
            for (const m of summaryMonths) {
                totalRow[`${monthLabel(m)} QTY Sale`] = totals.months?.[m]?.sale_quantity || 0;
                totalRow[`${monthLabel(m)} Actual Sale`] = totals.months?.[m]?.net_sales || 0;
                totalRow[`${monthLabel(m)} QTY W`] = totals.months?.[m]?.withdraw_quantity || 0;
                totalRow[`${monthLabel(m)} Actual W`] = totals.months?.[m]?.withdraw_value || 0;
                totalRow[`${monthLabel(m)} SI`] = totals.months?.[m]?.si_quantity || 0;
                totalRow[`${monthLabel(m)} SIA`] = totals.months?.[m]?.sia_quantity || 0;
            }
            totalRow["รวมทั้งหมด QTY Sale"] = totals.sale_quantity;
            totalRow["รวมทั้งหมด Actual Sale"] = totals.net_sales;
            totalRow["รวมทั้งหมด QTY W"] = totals.withdraw_quantity;
            totalRow["รวมทั้งหมด Actual W"] = totals.withdraw_value;
            totalRow["รวมทั้งหมด SI"] = totals.si_quantity;
            totalRow["รวมทั้งหมด SIA"] = totals.sia_quantity;

            exportData.push(totalRow);
            sheetName = "Store_SKU_Analysis";
            fileName = `Store_SKU_Analysis_${startDate}_to_${endDate}.xlsx`;
        } else if (mode === "sku") {
            exportData = displayRows.map(row => ({
                "รหัสสินค้า": row.product_code,
                "ชื่อสินค้า": row.product_name,
                "แบรนด์": row.product_brand,
                "ราคาขาย": row.salesPriceIncVAT,
                "Shelf Life": row.shelfLife,
                "Stock": row.stock_quantity,
                "ยอดขาย (ชิ้น)": row.sale_quantity,
                "ยอดขาย (บาท)": row.net_sales,
                "ตัดจ่าย (ชิ้น)": row.withdraw_quantity,
                "ตัดจ่าย (บาท)": row.withdraw_value,
                "SI": row.si_quantity,
                "SIA": row.sia_quantity
            }));
            exportData.push({
                "รหัสสินค้า": "รวม", "ชื่อสินค้า": "", "แบรนด์": "",
                "ราคาขาย": "", "Shelf Life": "",
                "Stock": totals.stock_quantity,
                "ยอดขาย (ชิ้น)": totals.sale_quantity,
                "ยอดขาย (บาท)": totals.net_sales,
                "ตัดจ่าย (ชิ้น)": totals.withdraw_quantity,
                "ตัดจ่าย (บาท)": totals.withdraw_value,
                "SI": totals.si_quantity,
                "SIA": totals.sia_quantity
            });
            sheetName = "SKU_Analysis";
            fileName = `SKU_Analysis_${startDate}_to_${endDate}.xlsx`;
        } else if (mode === "brand") {
            exportData = displayRows.map(row => {
                const obj = { "แบรนด์": row.brand, "Consign": row.consing_item || "" };
                for (const m of summaryMonths) {
                    obj[`${monthLabel(m)} ยอดขาย`] = row.months?.[m]?.sales || 0;
                    obj[`${monthLabel(m)} ตัดจ่าย`] = row.months?.[m]?.withdraw || 0;
                    obj[`${monthLabel(m)} (%)`] = row.months?.[m]?.condition || 0;
                }
                return obj;
            });
            const totalRow = { "แบรนด์": "รวม", "Consign": "" };
            for (const m of summaryMonths) {
                totalRow[`${monthLabel(m)} ยอดขาย`] = totals.months?.[m]?.sales || 0;
                totalRow[`${monthLabel(m)} ตัดจ่าย`] = totals.months?.[m]?.withdraw || 0;
                const ms = totals.months?.[m];
                totalRow[`${monthLabel(m)} (%)`] = ms?.sales > 0 ? parseFloat(((ms.withdraw / ms.sales) * 100).toFixed(2)) : 0;
            }
            exportData.push(totalRow);
            sheetName = "Brand_Analysis";
            fileName = `Brand_Analysis_${startDate}_to_${endDate}.xlsx`;
        } else if (mode === "storeSummary") {
            exportData = displayRows.map(row => {
                const obj = { "สาขา": row.branch_code, "ชื่อสาขา": row.branch_name };
                for (const m of summaryMonths) {
                    obj[`${monthLabel(m)} ยอดขาย`] = row.months?.[m]?.sales || 0;
                    obj[`${monthLabel(m)} ตัดจ่าย`] = row.months?.[m]?.withdraw || 0;
                    obj[`${monthLabel(m)} (%)`] = row.months?.[m]?.condition || 0;
                }
                return obj;
            });
            const totalRow = { "สาขา": "รวม", "ชื่อสาขา": "" };
            for (const m of summaryMonths) {
                totalRow[`${monthLabel(m)} ยอดขาย`] = totals.months?.[m]?.sales || 0;
                totalRow[`${monthLabel(m)} ตัดจ่าย`] = totals.months?.[m]?.withdraw || 0;
                const ms = totals.months?.[m];
                totalRow[`${monthLabel(m)} (%)`] = ms?.sales > 0 ? parseFloat(((ms.withdraw / ms.sales) * 100).toFixed(2)) : 0;
            }
            exportData.push(totalRow);
            sheetName = "Store_Summary";
            fileName = `Store_Summary_${startDate}_to_${endDate}.xlsx`;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    };

    return { exportToExcel };
};
