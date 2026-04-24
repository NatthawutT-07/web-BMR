import React from "react";
import { fmt } from "../utils/analysisUtils";

const SummaryCards = ({ totals }) => {
    const cards = [
        { label: "ยอดขาย (ชิ้น)", value: fmt(totals.sale_quantity), color: "text-blue-600" },
        { label: "ยอดขาย (บาท)", value: fmt(totals.net_sales), color: "text-green-600" },
        { label: "ตัดจ่าย (ชิ้น)", value: fmt(totals.withdraw_quantity), color: "text-orange-600" },
        { label: "ตัดจ่าย (บาท)", value: fmt(totals.withdraw_value), color: "text-red-600" },
        { label: "SI", value: fmt(totals.si_quantity), color: "text-purple-600" },
        { label: "SIA", value: fmt(totals.sia_quantity), color: "text-pink-600" },
    ];

    return (
        <div className="grid gap-3 mb-6 grid-cols-2 sm:grid-cols-5">
            {cards.map((c) => (
                <div key={c.label} className="bg-white border rounded-xl p-3 shadow-sm text-center">
                    <div className="text-xs text-gray-500">{c.label}</div>
                    <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
                </div>
            ))}
        </div>
    );
};

export default SummaryCards;
