import React, { useState } from 'react';
import MainFilterSales from '../../../components/admin/sales/sales-branch/MainFilterSales';
import DashboardSales from '../../../components/admin/sales/dashboard/DashboardSales';
import MainSalesProduct from '../../../components/admin/sales/product/MainSalesProduct';
import CalculatorSales from '../../../components/admin/sales/calculator/CalculatorSales';

const FilterSales = () => {
    const [activePage, setActivePage] = useState('sales');

    return (
        <div>
            <nav className="flex items-center justify-between px-6 py-2 bg-gray-100 text-black">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActivePage('dashboard-sales')}
                        className={`hover:text-yellow-600 ${activePage === 'dashboard-sales' ? 'font-bold underline' : ''}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActivePage('sales')}
                        className={`hover:text-yellow-600 ${activePage === 'sales' ? 'font-bold underline' : ''}`}
                    >
                        Sales
                    </button>
                    <button
                        onClick={() => setActivePage('product-sales')}
                        className={`hover:text-yellow-600 ${activePage === 'product-sales' ? 'font-bold underline' : ''}`}
                    >
                        Product
                    </button>
                    <button
                        onClick={() => setActivePage('calculator-sales')}
                        className={`hover:text-yellow-600 ${activePage === 'calculator-sales' ? 'font-bold underline' : ''}`}
                    >
                        calculator
                    </button>
                </div>
            </nav>

            <div className="">
                {activePage === 'dashboard-sales' && <DashboardSales />}
                {activePage === 'sales' && <MainFilterSales />}
                {activePage === 'product-sales' && <MainSalesProduct />}
                {activePage === 'calculator-sales' && <CalculatorSales />}
            </div>
        </div>
    );
};

export default FilterSales;
