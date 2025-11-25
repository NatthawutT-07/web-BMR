import React from "react";

const ProductTable = ({ title, data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto bg-white p-2 rounded shadow-sm flex-1 text-xs mt-4">
      {title && <div className="font-semibold mb-1">{title}</div>}
      <table className="min-w-full border border-gray-200">
        <thead className="bg-green-100 sticky top-0 text-xs">
          <tr>
            <th className="border px-2 py-1 text-left">ID</th>
            <th className="border px-2 py-1 text-left">Code</th>
            <th className="border px-2 py-1 text-left">Name</th>
            <th className="border px-2 py-1 text-right">Sales</th>
            <th className="border px-2 py-1 text-right">Return</th>
            <th className="border px-2 py-1 text-right">Total</th>
            <th className="border px-2 py-1 text-right">Discount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, idx) => (
            <tr
              key={idx}
              className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-green-50`}
            >
              <td className="border px-2 py-1">{idx + 1}</td>
              <td className="border px-2 py-1">
                {p.product_code ? p.product_code.toString().padStart(5, "0") : "-"}
              </td>
              <td className="border px-2 py-1">{p.product_brand} : {p.product_name}</td>
              <td className="border px-2 py-1 text-right">{p.sale_quantity}</td>
              <td className="border px-2 py-1 text-right">
                {p.return_quantity == null
                  ? "-"
                  : p.return_quantity === 0
                    ? "-"
                    : p.return_quantity}
              </td>
              <td className="border px-2 py-1 text-right">
                {p.total_net_sales.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="border px-2 py-1 text-right">
                {p.total_discount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
