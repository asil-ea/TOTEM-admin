'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Activity } from 'lucide-react';

interface MainNavProps {
  userEmail?: string | null;
  onLogout: () => void;
}

export function MainNav({ userEmail, onLogout }: MainNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl">
            TOTEM Admin
          </Link>
          {userEmail && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/"
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Button variant="ghost" className="gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </Link>
              <Link
                href="/logs"
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === "/logs" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Button variant="ghost" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Access Logs
                </Button>
              </Link>
            </nav>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {userEmail && (
            <>
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 