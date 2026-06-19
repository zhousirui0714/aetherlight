import { Link } from "@tanstack/react-router";
import { Home, MessageCircle, Brush, Users, User } from "lucide-react";

const tabs = [
  { to: "/", label: "溯光", icon: Home },
  { to: "/chat", label: "对话", icon: MessageCircle },
  { to: "/create", label: "创作", icon: Brush },
  { to: "/community", label: "社区", icon: Users },
  { to: "/profile", label: "我的", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-2xl items-stretch">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-xs transition-colors hover:text-foreground"
            >
              <Icon className="h-5 w-5" strokeWidth={1.6} />
              <span className="font-serif tracking-wider">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
