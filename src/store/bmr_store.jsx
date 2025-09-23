import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const BmrStore = (set) => ({
  user: null,
  token: null,

  actionLogin: async (form) => {
    try {
      const res = await axios.post('http://localhost:5001/api/login', form);
      set({ user: res.data.payload, token: res.data.token });
      return res;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  },
  logout: () => {
    set({ user: null, token: null });
   
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bmr-store');
    }
  }

});

const useBmrStore = create(
  persist(BmrStore, { name: 'bmr-store', storage: createJSONStorage(() => localStorage) })
);

export default useBmrStore;



// import React, { useEffect } from "react";
// import useBmrStore from "../store/bmr_store"; // นำเข้า store ที่สร้างขึ้น

// const ProfilePage = () => {
//   const { user, token, logout } = useBmrStore(state => ({
//     user: state.user,
//     token: state.token,
//     logout: state.logout
//   }));

//   useEffect(() => {
//     if (!user) {
//       // ถ้า user เป็น null (ไม่ได้ login), ให้ redirect ไปหน้า login
//       window.location.href = "/login";
//     }
//   }, [user]);

//   return (
//     <div>
//       <h1>Profile Page</h1>
//       <p>Welcome, {user ? user.name : "Guest"}!</p>
//       <button onClick={logout}>Logout</button>
//     </div>
//   );
// };

// export default ProfilePage;
