"use client";

import { usePathname } from "next/navigation";

export default function SideNav({ links }) {
  const p = usePathname();
  return (
    <nav>
      {links.map((l) => {
        const on = l.href === "/admin" ? p === "/admin" : p.startsWith(l.href);
        return (
          <a key={l.href} href={l.href} className={on ? "on" : ""}>
            <span>{l.label}</span>
            {l.count > 0 && <span className="count">{l.count}</span>}
          </a>
        );
      })}
    </nav>
  );
}
