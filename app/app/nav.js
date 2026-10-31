"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  ["/app", "لوحتي"],
  ["/app/upload", "رفع فحص"],
  ["/app/support", "الدعم"],
];

export default function Nav() {
  const p = usePathname();
  return (
    <nav className="topnav">
      {LINKS.map(([h, t]) => {
        const on = h === "/app" ? p === "/app" || p.startsWith("/app/report") : p.startsWith(h);
        return <a key={h} href={h} className={on ? "on" : ""}>{t}</a>;
      })}
    </nav>
  );
}
