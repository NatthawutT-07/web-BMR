import React from "react";
import { useNavigate } from "react-router-dom";
// import ShowDashboard from "../../components/admin/ShowDashboard";

const Dashboard = () => {
  const navigate = useNavigate();

  const shortcuts = [
    // {
    //   key: "sales",
    //   title: "Sales dashboard",
    //   desc: "ดูยอดขาย, เปรียบเทียบสาขา, สรุปรายได้รายวัน/เดือน",
    //   color: "from-emerald-400 to-emerald-500",
    //   badge: "Sales",
    // },
    {
      key: "dashboard-shelf",
      title: "Shelf dashboard",
      desc: "ภาพรวมสต็อก, ยอดขาย และการเบิกทุกสาขา",
      color: "from-violet-400 to-violet-500",
      badge: "Shelf",
    },
    {
      key: "shelf",
      title: "Store & shelf",
      desc: "จัดการชั้นวาง, สินค้าหน้าร้าน และภาพรวมสต็อก",
      color: "from-sky-400 to-sky-500",
      badge: "Store",
    },
    // {
    //   key: "upload",
    //   title: "Upload CSV",
    //   desc: "นำเข้าข้อมูลบิลขาย / สินค้า จากไฟล์ CSV",
    //   color: "from-amber-400 to-amber-500",
    //   badge: "Data",
    // },
  ];

  return (
    <div className="mt-4 sm:mt-8 lg:mt-10 bg-gradient-to-br flex items-center justify-center px-4 py-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <header className="mb-6 md:mb-8 text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200 text-[11px] uppercase tracking-[0.16em] text-slate-500 shadow-sm mb-2">
            BMR Admin Console
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">
            Welcome 👋
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            เลือกหน้ารายงานที่ต้องการใช้งาน ระบบเตรียมลิงก์ลัดไว้ให้แล้ว
          </p>
        </header>

        {/* Main card */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] px-4 py-4 md:px-6 md:py-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h2 className="text-sm font-medium text-slate-800">
                Quick access
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กดเลือกเมนูที่ต้องการได้เลย ไม่ต้องผ่านหลายหน้า
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.4)]" />
              <span>Online</span>
            </div>
          </div>

          <div className="space-y-3">
            {shortcuts.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={`
                  group w-full text-left
                  rounded-xl border border-slate-100
                  bg-white
                  hover:border-sky-200
                  hover:bg-sky-50/70
                  transition-all duration-200
                  px-3.5 py-3 md:px-4 md:py-3.5
                  flex items-center justify-between gap-3
                  shadow-[0_10px_25px_rgba(15,23,42,0.03)]
                  hover:shadow-[0_16px_35px_rgba(56,189,248,0.25)]
                `}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Icon circle */}
                  <div
                    className={`
                      h-9 w-9 md:h-10 md:w-10 rounded-xl
                      bg-gradient-to-br ${item.color}
                      flex items-center justify-center
                      text-sm md:text-base font-semibold
                      text-white shadow-sm
                    `}
                  >
                    {item.badge.charAt(0)}
                  </div>

                  {/* Text */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm md:text-base font-medium text-slate-800">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1 text-[11px] md:text-xs text-slate-400">
                  <span className="hidden md:inline group-hover:text-slate-600">
                    เปิดดู
                  </span>
                  <span className="text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transform transition-transform">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Tip: เมนูทั้งหมดอยู่ในแถบด้านซ้ายด้วย สามารถเปลี่ยนหน้าได้ทุกเมื่อ
            </p>
            <span className="text-[11px] text-slate-400">
              BMR Admin • v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
