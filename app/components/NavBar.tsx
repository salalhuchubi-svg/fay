"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function NavBar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Fay", icon: "✦" },
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(5,5,8,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(42,42,64,0.5)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="gradient-text font-bold text-xl">Fay</span>
      </div>

      <div className="flex items-center gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background:
                  pathname === link.href
                    ? "rgba(157,78,221,0.2)"
                    : "transparent",
                color:
                  pathname === link.href ? "#e040fb" : "rgba(240,240,255,0.6)",
                border:
                  pathname === link.href
                    ? "1px solid rgba(157,78,221,0.4)"
                    : "1px solid transparent",
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
