"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Heart,
  Droplet,
  Users,
  FileText,
  Bell,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Hospital,
  Calendar,
  BarChart3,
  Clock,
  Activity,
} from "lucide-react";

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

interface HospitalProfile {
  id?: string;
  _id?: string;

  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  hospitalLicense?: string;
  hospitalType?: string;

  status?: "active" | "pending" | "inactive";

  createdAt?: string;
  updatedAt?: string;
}

export function HospitalSidebar({
  isOpen,
  setIsOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  const [expandedItems, setExpandedItems] = useState<string[]>([
    "blood-requests",
  ]);

  const [profile, setProfile] =
    useState<HospitalProfile | null>(null);

  const [hospitalName, setHospitalName] =
    useState("Hospital");

  /* =========================================================
     LOAD HOSPITAL INFORMATION
  ========================================================= */

  useEffect(() => {
    const loadHospital = async () => {
      try {
        const storedUser =
          localStorage.getItem("user");

        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);

            if (userData.hospitalName) {
              setHospitalName(
                userData.hospitalName
              );
            }
          } catch (error) {
            console.error(
              "Error parsing user:",
              error
            );
          }
        }

        const token =
          localStorage.getItem("token");

        if (!token) return;

        const response = await fetch(
          "/api/hospital/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data?.data) {
          setProfile(data.data);

          if (data.data.hospitalName) {
            setHospitalName(
              data.data.hospitalName
            );
          }
        }
      } catch (error) {
        console.error(
          "Error loading hospital profile:",
          error
        );
      }
    };

    loadHospital();
  }, []);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isActiveParent = (paths: string[]) => {
    return paths.some((path) =>
      pathname?.startsWith(path)
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userData");

    sessionStorage.clear();

    router.push("/");
  };

  /* =========================================================
     INITIALS
  ========================================================= */

  const getHospitalInitials = () => {
    return hospitalName
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /* =========================================================
     NAVIGATION ITEMS
  ========================================================= */

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/hospital/dashboard",
      active: isActive(
        "/hospital/dashboard"
      ),
    },

    {
      label: "Donors",
      icon: Users,
      href: "/hospital/donors",
      active: isActive(
        "/hospital/donors"
      ),
    },

    {
      label: "Blood Requests",
      icon: Droplet,
      href: "/hospital/requests",
      active: isActiveParent([
        "/hospital/requests",
      ]),

      children: [
        {
          label: "Pending",
          icon: Clock,
          href: "/hospital/requests/pending",
          active: isActive(
            "/hospital/requests/pending"
          ),
        },

        {
          label: "History",
          icon: FileText,
          href: "/hospital/requests/history",
          active: isActive(
            "/hospital/requests/history"
          ),
        },
      ],
    },

    {
      label: "Blood Drives",
      icon: Calendar,
      href: "/hospital/blood-drives",
      active: isActive(
        "/hospital/blood-drives"
      ),
    },

    {
      label: "Inventory",
      icon: BarChart3,
      href: "/hospital/inventory",
      active: isActive(
        "/hospital/inventory"
      ),
    },
  ];

  /* =========================================================
     SIDEBAR
  ========================================================= */

  return (
    <SidebarPrimitive
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="border-r border-zinc-200/70 dark:border-zinc-800/70"
    >
      {/* =====================================================
          HEADER - FIXED HEIGHT: Added h-16 flex-shrink-0
      ===================================================== */}

      <SidebarHeader className="border-b border-sidebar-border h-16 flex-shrink-0">
        <div
          className={`flex h-full items-center ${
            isCollapsed
              ? "justify-center px-2"
              : "px-4"
          }`}
        >
          <Link
            href="/hospital/dashboard"
            className="flex items-center gap-3 min-w-0"
          >
            {/* Life Monitor Graph Icon - Red */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-md shadow-red-200/60 dark:shadow-red-900/30">
              <Activity
                className="h-[18px] w-[18px] text-white"
                strokeWidth={2.5}
              />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
                  RedPulse
                </h1>

                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-sidebar-foreground/60">
                  Hospital Portal
                </p>
              </div>
            )}
          </Link>
        </div>
      </SidebarHeader>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;

                const hasChildren =
                  !!item.children &&
                  item.children.length > 0;

                const itemKey =
                  item.label
                    .toLowerCase()
                    .replace(/\s+/g, "-");

                const isExpanded =
                  expandedItems.includes(
                    itemKey
                  );

                /* =============================================
                   COLLAPSIBLE ITEM
                ============================================= */

                if (hasChildren) {
                  const parentActive =
                    item.active ||
                    isActiveParent(
                      item.children?.map(
                        (child) =>
                          child.href
                      ) || []
                    );

                  return (
                    <SidebarMenuItem
                      key={item.label}
                    >
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={(open) => {
                          setExpandedItems(
                            (prev) => {
                              if (open) {
                                return prev.includes(
                                  itemKey
                                )
                                  ? prev
                                  : [
                                      ...prev,
                                      itemKey,
                                    ];
                              }

                              return prev.filter(
                                (i) =>
                                  i !==
                                  itemKey
                              );
                            }
                          );
                        }}
                        className="w-full"
                      >
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton
                              isActive={
                                parentActive
                              }
                              tooltip={
                                isCollapsed
                                  ? item.label
                                  : undefined
                              }
                              className="h-10 w-full rounded-lg px-3"
                            />
                          }
                        >
                          <Icon className="h-5 w-5 shrink-0" />

                          {!isCollapsed && (
                            <>
                              <span className="truncate text-sm font-medium">
                                {item.label}
                              </span>

                              <span className="ml-auto">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                            </>
                          )}
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border pl-2">
                            {item.children?.map(
                              (child) => {
                                const ChildIcon =
                                  child.icon;

                                return (
                                  <SidebarMenuSubItem
                                    key={
                                      child.href
                                    }
                                  >
                                    <SidebarMenuSubButton
                                      isActive={
                                        child.active
                                      }
                                      render={
                                        <Link
                                          href={
                                            child.href
                                          }
                                          onClick={() =>
                                            setIsOpen?.(
                                              false
                                            )
                                          }
                                        />
                                      }
                                      className="h-9 rounded-md"
                                    >
                                      <ChildIcon className="h-4 w-4" />

                                      <span className="text-sm">
                                        {
                                          child.label
                                        }
                                      </span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              }
                            )}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                }

                /* =============================================
                   NORMAL ITEM
                ============================================= */

                return (
                  <SidebarMenuItem
                    key={item.href}
                  >
                    <SidebarMenuButton
                      isActive={item.active}
                      tooltip={
                        isCollapsed
                          ? item.label
                          : undefined
                      }
                      render={
                        <Link
                          href={item.href}
                          onClick={() =>
                            setIsOpen?.(
                              false
                            )
                          }
                        />
                      }
                      className="h-10 rounded-lg px-3"
                    >
                      <Icon className="h-5 w-5 shrink-0" />

                      {!isCollapsed && (
                        <span className="truncate text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* =====================================================
          HOSPITAL PROFILE
      ===================================================== */}

      <div className="mt-auto border-t border-sidebar-border p-3">
        <div
          className={`flex items-center gap-3 rounded-xl bg-sidebar-accent/50 ${
            isCollapsed
              ? "justify-center p-2"
              : "px-3 py-3"
          }`}
        >
          {/* AVATAR */}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {getHospitalInitials()}
          </div>

          {/* HOSPITAL INFO */}

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {hospitalName}
              </p>

              <p className="truncate text-xs text-sidebar-foreground/60">
                Hospital Administrator
              </p>
            </div>
          )}
        </div>
      </div>
    </SidebarPrimitive>
  );
}

export default HospitalSidebar;