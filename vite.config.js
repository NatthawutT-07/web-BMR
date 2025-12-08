import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // ยกเพดาน warning (ไฟล์ใหญ่ไม่เตือน)
    chunkSizeWarningLimit: 1500,

    // แยก bundle ให้ไฟล์หลักเล็กลงและ cache ดีขึ้น
    rollupOptions: {
      output: {
        manualChunks: {
          // แยก React ออก 1 ไฟล์
          react: ["react", "react-dom"],

          // แยก Chart.js ออก (ตัวนี้หนักมาก)
          chart: ["chart.js"],

          // แยก XLSX ออก (หนักมาก ใช้เฉพาะหน้า upload)
          xlsx: ["xlsx"],
        },
      },
    },
  },

  // ทำให้ dev/start เร็วขึ้น
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "chart.js",
      "xlsx",
    ],
  },
});


// server: {
//   allowedHosts: ['web-bmr.ngrok.app','localhost'],
// },
