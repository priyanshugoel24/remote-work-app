"use client";

import React, { useState } from "react";
import { Home, MessageSquare, Phone, Bell, Users, Settings } from "lucide-react";
import Link from "next/link";

const Sidebar: React.FC = () => {
  const [active, setActive] = useState("Home");

  const menuItems = [
    { name: "Home", icon: <Home size={24} />, link: "/" },
    { name: "Chats", icon: <MessageSquare size={24} />, link: "/chats" },
    { name: "Calls", icon: <Phone size={24} />, link: "/calls" },
    { name: "Activity", icon: <Bell size={24} />, link: "/activity" },
    { name: "Teams", icon: <Users size={24} />, link: "/teams" },
    { name: "Settings", icon: <Settings size={24} />, link: "/settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-gray-900 text-white flex flex-col items-center py-6 space-y-8">
      {menuItems.map((item) => (
        <Link href={item.link} key={item.name}>
          <button
            className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
              active === item.name ? "text-indigo-400" : "text-gray-400"
            } hover:text-indigo-300`}
            onClick={() => setActive(item.name)}
            role="menuitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setActive(item.name);
              }
            }}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        </Link>
      ))}
    </aside>
  );
};

export default Sidebar;