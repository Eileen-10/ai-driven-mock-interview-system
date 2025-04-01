"use client";
import React from "react";
import { Home, Mic, ChartColumn} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function AppSidebar() {

  return (
    <div className="h-screen p-2 flex flex-col items-center bg-[#05060B] shadow-md transition-all duration-300 space-y-2">

      {/* Navigation Icons */}
      <NavItem href="/dashboard/home" icon={Home} tooltip="Home" />
      <NavItem href="/dashboard/mockInterview" icon={Mic} tooltip="Mock Interview" />
      <NavItem href="/dashboard/analytics" icon={ChartColumn} tooltip="Analytic Dashboard" />
    </div>
  );
}

export default AppSidebar

function NavItem({ href, icon: Icon, tooltip }) {

  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
          href={href} 
          className={`group relative flex items-center justify-center p-3 rounded-full transition-all
            ${isActive ? "bg-gray-200 text-black" : "text-white"}
            hover:bg-gray-200 hover:text-black`}>
            <Icon className="w-6 h-6 transition-all" />
            </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-200 text-black">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
