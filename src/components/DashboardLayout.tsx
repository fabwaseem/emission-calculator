 import React, { useState } from "react";
 import { Link, useLocation } from "react-router-dom";
 import {
   LayoutDashboard,
   Calculator,
   FileText,
   Menu,
   X,
   Plane,
 } from "lucide-react";
 import { cn } from "@/lib/utils";

 interface SidebarLinkProps {
   href: string;
   icon: React.ReactNode;
   title: string;
   isActive: boolean;
 }

 const SidebarLink: React.FC<SidebarLinkProps> = ({
   href,
   icon,
   title,
   isActive,
 }) => (
   <Link
     to={href}
     className={cn(
       "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
       isActive
         ? "bg-secondary text-secondary-foreground"
         : "hover:bg-secondary/50 text-muted-foreground"
     )}
   >
     {icon}
     <span>{title}</span>
   </Link>
 );

 const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
   children,
 }) => {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const location = useLocation();

   const navigation = [
     {
       href: "/",
       icon: <LayoutDashboard className="h-5 w-5" />,
       title: "Dashboard",
     },
     {
       href: "/calculate",
       icon: <Calculator className="h-5 w-5" />,
       title: "Calculate",
     },
     {
       href: "/reports",
       icon: <FileText className="h-5 w-5" />,
       title: "Reports",
     },
   ];

   return (
     <div className="min-h-screen bg-background">
       {/* Mobile Sidebar Toggle */}
       <button
         onClick={() => setSidebarOpen(!sidebarOpen)}
         className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-lg"
       >
         {sidebarOpen ? (
           <X className="h-5 w-5" />
         ) : (
           <Menu className="h-5 w-5" />
         )}
       </button>

       {/* Sidebar */}
       <aside
         className={cn(
           "fixed top-0 left-0 z-40 h-screen border-r bg-card transition-transform lg:translate-x-0",
           sidebarOpen ? "translate-x-0" : "-translate-x-full"
         )}
       >
         <div className="flex h-full flex-col gap-4 px-4 py-6">
           <div className="flex items-center gap-2 px-3">
             <Plane className="h-6 w-6 text-primary" />
             <span className="text-lg font-semibold">Flight Emissions</span>
           </div>
           <nav className="flex flex-1 flex-col gap-1">
             {navigation.map((item) => (
               <SidebarLink
                 key={item.href}
                 {...item}
                 isActive={location.pathname === item.href}
               />
             ))}
           </nav>
         </div>
       </aside>

       {/* Main Content */}
       <main
         className={cn(
           "min-h-screen transition-all duration-200 ease-in-out",
           "lg:ml-64 p-8"
         )}
       >
         <div className="mx-auto max-w-7xl">{children}</div>
       </main>
     </div>
   );
 };

 export default DashboardLayout;