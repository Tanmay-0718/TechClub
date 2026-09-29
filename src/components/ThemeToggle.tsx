import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full hover:bg-foreground/10 active:scale-95 transition-[transform,background-color,border-color] duration-150 ease-emil-out">
          <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 opacity-100 transition-[transform,opacity] duration-200 ease-emil-out dark:-rotate-90 dark:scale-90 dark:opacity-0" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-90 opacity-0 transition-[transform,opacity] duration-200 ease-emil-out dark:rotate-0 dark:scale-100 dark:opacity-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-0 shadow-xl min-w-[8.5rem] p-1.5 rounded-2xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer rounded-xl px-3 py-2 text-xs font-light tracking-wide transition-all duration-100 active:scale-[0.97] hover:bg-foreground/10">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer rounded-xl px-3 py-2 text-xs font-light tracking-wide transition-all duration-100 active:scale-[0.97] hover:bg-foreground/10">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer rounded-xl px-3 py-2 text-xs font-light tracking-wide transition-all duration-100 active:scale-[0.97] hover:bg-foreground/10">
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
