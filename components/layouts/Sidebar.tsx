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
  Settings,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Hospital,
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  const [expandedItems, setExpandedItems] = useState<string[]>([
    "reports",
  ]);

  const [userName, setUserName] = useState("John Doe");

  const isCollapsed = state === "collapsed";

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) return

    try {
      const userData = JSON.parse(user)

      if (userData.fullName) {
        setUserName(userData.fullName)
      }
    } catch (error) {
      console.error(
        "Error parsing user data:",
        error
      )
    }
  }, [])

  /* =======================================================
     ACTIVE ROUTES
  ======================================================= */

  const isActive = (path: string) => {
    return pathname === path
  }

  const isActiveParent = (
    paths: string[]
  ) => {
    return paths.some((path) =>
      pathname?.startsWith(path)
    )
  }

  /* =======================================================
     INITIALS
  ======================================================= */

  const getUserInitials = () => {
    const initials = userName
      .split(" ")
      .filter(Boolean)
      .map((word) =>
        word.charAt(0)
      )
      .join("")
      .toUpperCase()
      .slice(0, 2)

    return initials || "AD"
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      active:
        isActive("/admin/dashboard"),
    },

    {
      label: "Donors",
      icon: Users,
      href: "/admin/donors",
      active:
        isActive("/admin/donors"),
    },

    {
      label: "Hospitals",
      icon: Hospital,
      href: "/admin/hospitals",
      active:
        isActive("/admin/hospitals"),
    },

    {
      label: "Blood Inventory",
      icon: Droplet,
      href: "/admin/inventory",
      active:
        isActive("/admin/inventory"),
    },

    {
      label: "Reports",
      icon: FileText,
      href: "/admin/reports",
      active:
        isActiveParent([
          "/admin/reports",
        ]),

      children: [
        {
          label: "Requests",
          icon: Bell,
          href:
            "/admin/reports/requests",
          active:
            isActive(
              "/admin/reports/requests"
            ),
        },

        {
          label: "Donations",
          icon: Droplet,
          href:
            "/admin/reports/donations",
          active:
            isActive(
              "/admin/reports/donations"
            ),
        },

        {
          label: "Analytics",
          icon: Settings,
          href:
            "/admin/reports/analytics",
          active:
            isActive(
              "/admin/reports/analytics"
            ),
        },
      ],
    },
  ]

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SidebarPrimitive
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="border-r border-zinc-200/70 dark:border-zinc-800/70"
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <SidebarHeader className="border-b border-sidebar-border p-0">

        <div
          className={[
            "flex h-16 items-center",
            isCollapsed
              ? "justify-center px-2"
              : "px-4",
          ].join(" ")}
        >

          <Link
            href="/admin/dashboard"
            className="flex min-w-0 items-center gap-3"
          >

            {/* LOGO - EKG/Life Monitor Icon */}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-md shadow-red-200/60 dark:shadow-red-900/30">
              <Activity
                className="h-[18px] w-[18px] text-white"
                strokeWidth={2.5}
              />
            </div>

            {/* BRAND */}

            {!isCollapsed && (
              <div className="min-w-0">

                <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
                  RedPulse
                </h1>

                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-sidebar-foreground/60">
                  Admin Panel
                </p>

              </div>
            )}

          </Link>

        </div>

      </SidebarHeader>

      {/* ===================================================
          NAVIGATION
      =================================================== */}

      <SidebarContent className="px-2 py-4">

        <SidebarGroup className="p-0">

          <SidebarGroupContent>

            <SidebarMenu className="gap-1">

              {navItems.map((item) => {
                const Icon = item.icon

                const hasChildren =
                  !!item.children &&
                  item.children.length > 0

                const itemKey =
                  item.label.toLowerCase()

                const isExpanded =
                  expandedItems.includes(
                    itemKey
                  )

                /* =========================================
                   COLLAPSIBLE
                ========================================= */

                if (hasChildren) {
                  return (
                    <SidebarMenuItem
                      key={item.label}
                    >

                      <Collapsible
                        open={isExpanded}
                        onOpenChange={(open) => {
                          setExpandedItems(
                            (previous) => {
                              if (open) {
                                return previous.includes(
                                  itemKey
                                )
                                  ? previous
                                  : [
                                      ...previous,
                                      itemKey,
                                    ]
                              }

                              return previous.filter(
                                (value) =>
                                  value !==
                                  itemKey
                              )
                            }
                          )
                        }}
                        className="w-full"
                      >

                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton
                              isActive={
                                item.active ||
                                isActiveParent(
                                  item.children?.map(
                                    (child) =>
                                      child.href
                                  ) || []
                                )
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
                                  child.icon

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
                                )
                              }
                            )}

                          </SidebarMenuSub>

                        </CollapsibleContent>

                      </Collapsible>

                    </SidebarMenuItem>
                  )
                }

                /* =========================================
                   NORMAL ITEM
                ========================================= */

                return (
                  <SidebarMenuItem
                    key={item.href}
                  >

                    <SidebarMenuButton
                      isActive={
                        item.active
                      }
                      tooltip={
                        isCollapsed
                          ? item.label
                          : undefined
                      }
                      render={
                        <Link
                          href={item.href}
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
                )
              })}

            </SidebarMenu>

          </SidebarGroupContent>

        </SidebarGroup>

      </SidebarContent>

      {/* ===================================================
          USER PROFILE (No Logout Button)
      =================================================== */}

      <div className="mt-auto border-t border-sidebar-border p-3">

        <div
          className={[
            "flex items-center gap-3 rounded-xl",
            "bg-sidebar-accent/50",
            isCollapsed
              ? "justify-center p-2"
              : "px-3 py-3",
          ].join(" ")}
        >

          {/* AVATAR */}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {getUserInitials()}
          </div>

          {/* USER INFORMATION */}

          {!isCollapsed && (
            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>

              <p className="truncate text-xs text-sidebar-foreground/60">
                Administrator
              </p>

            </div>
          )}

        </div>

      </div>

    </SidebarPrimitive>
  )
}