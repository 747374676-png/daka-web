import { NavLink, useLocation } from 'react-router-dom';
import { getUserId } from '@/data/tracker';

export default function Header() {
  const { pathname } = useLocation();
  const userId = getUserId();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 flex h-14 items-center justify-between">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">奖</span>
          </div>
          <span className="font-semibold text-sm">奖励打卡</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`
            }
          >
            我的打卡
          </NavLink>
          {userId && (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`
              }
            >
              <span className="flex items-center gap-1">
                <span className="size-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px]">
                  {userId.charAt(0).toUpperCase()}
                </span>
                {userId}
              </span>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
