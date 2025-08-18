"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import {
  FaHome,
  FaUtensils,
  FaConciergeBell,
  FaShoppingCart,
  FaUsers,
  FaChartBar,
} from "react-icons/fa";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: FaHome },
    { href: "/admin/menu", label: "Menu", icon: FaUtensils },
    { href: "/admin/combos", label: "Combos", icon: FaConciergeBell },
    { href: "/admin/orders", label: "Orders", icon: FaShoppingCart },
    { href: "/admin/users", label: "Users", icon: FaUsers },
    { href: "/admin/stats", label: "Stats", icon: FaChartBar },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-screen fixed left-0 top-0 p-4 flex flex-col justify-between">
      <div>
        
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Panel</h2>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-2 my-2 rounded hover:bg-gray-700 ${
                  pathname === item.href ? "bg-gray-600" : ""
                }`}
              >
                <Icon className="mr-2" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {session && (
        <Button
          variant="outline"
          className="w-full text-white border-white hover:bg-gray-700"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      )}
    </div>
  );
}
