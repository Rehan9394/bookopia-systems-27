
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Calendar, 
  Home, 
  Settings, 
  Users, 
  BookOpen, 
  DollarSign, 
  Brush, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  FileText,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon: Icon, label, collapsed, onClick }: NavItemProps) => {
  if (onClick) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group justify-start",
          collapsed ? "justify-center" : "",
          "text-foreground/70 hover:bg-accent hover:text-foreground"
        )}
        onClick={onClick}
      >
        <Icon className={cn("h-5 w-5 transition-transform", !collapsed && "group-hover:scale-110")} />
        {!collapsed && <span>{label}</span>}
        {collapsed && (
          <div className="absolute left-16 rounded-md px-2 py-1 ml-6 bg-popover text-foreground shadow-md opacity-0 -translate-x-3 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </Button>
    );
  }
  
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
        collapsed ? "justify-center" : "",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-foreground/70 hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform", !collapsed && "group-hover:scale-110")} />
      {!collapsed && <span>{label}</span>}
      {collapsed && (
        <div className="absolute left-16 rounded-md px-2 py-1 ml-6 bg-popover text-foreground shadow-md opacity-0 -translate-x-3 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </NavLink>
  );
};

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
}

const NavGroup = ({ title, children, collapsed }: NavGroupProps) => {
  return (
    <div className="mb-6">
      {!collapsed && (
        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider px-3 mb-2">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if user has admin or manager role
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <div 
      className={cn(
        "h-screen sticky top-0 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-border">
        {!collapsed && (
          <div className="font-semibold text-lg tracking-tight">
            HotelManager
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("rounded-full", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex-grow overflow-y-auto py-4 px-2">
        <NavGroup title="Overview" collapsed={collapsed}>
          <NavItem to="/" icon={Home} label="Dashboard" collapsed={collapsed} />
          <NavItem to="/bookings" icon={BookOpen} label="Bookings" collapsed={collapsed} />
          <NavItem to="/availability" icon={Calendar} label="Availability" collapsed={collapsed} />
        </NavGroup>
        
        <NavGroup title="Management" collapsed={collapsed}>
          <NavItem to="/rooms" icon={Home} label="Rooms" collapsed={collapsed} />
          <NavItem to="/expenses" icon={DollarSign} label="Expenses" collapsed={collapsed} />
          <NavItem to="/cleaning" icon={Brush} label="Cleaning Status" collapsed={collapsed} />
        </NavGroup>
        
        <NavGroup title="Administration" collapsed={collapsed}>
          {isAdmin && <NavItem to="/users" icon={Users} label="Users" collapsed={collapsed} />}
          {isAdminOrManager && <NavItem to="/owners" icon={UserCheck} label="Owners" collapsed={collapsed} />}
          <NavItem to="/reports" icon={BarChart} label="Reports" collapsed={collapsed} />
          {isAdminOrManager && <NavItem to="/audit" icon={ClipboardList} label="Audit Logs" collapsed={collapsed} />}
          {isAdminOrManager && <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />}
        </NavGroup>
      </div>
      
      <div className="p-2 border-t border-border">
        <NavItem 
          to="#" 
          icon={LogOut} 
          label="Logout" 
          collapsed={collapsed} 
          onClick={handleLogout}
        />
      </div>
    </div>
  );
}
