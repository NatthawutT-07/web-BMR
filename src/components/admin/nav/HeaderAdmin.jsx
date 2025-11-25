import React from "react";
import { Link } from "react-router-dom";

const HeaderAdmin = () => {
  return (
    <nav className="flex justify-start p-2 bg-gray-100">
      <Link to="/admin/viewshelf">
        <button className="bg-pink-500 text-white px-4 py-2 mx-2 rounded-lg hover:bg-pink-600 transition-colors duration-300">
          Shelf
        </button>
      </Link>
      <Link to="/admin/sales-view">
        <button className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors duration-300">
          Sales
        </button>
      </Link>
    </nav>
  );
};

export default HeaderAdmin;
