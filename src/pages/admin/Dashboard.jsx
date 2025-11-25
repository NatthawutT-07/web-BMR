import React from 'react'
import ShowDashboard from '../../components/admin/ShowDashboard'
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    // <ShowDashboard/>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "20px",
        backgroundColor: "#f0f2f5",
      }}
    >
      <button
        onClick={() => navigate("sales")}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#4CAF50",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
      >
        Go to Sales 
      </button>

      <button
        onClick={() => navigate("shelf")}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#2196F3",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#0b7dda")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#2196F3")}
      >
        Go to Store
      </button>

      <button
        onClick={() => navigate("upload")}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#FF9800",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#fb8c00")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#FF9800")}
      >
        Go to Upload CSV
      </button>
    </div>
  );
};

export default Dashboard;
