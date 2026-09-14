"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PanelLeftIcon } from "lucide-react"

/* =========================================================
   CONSTANTS
========================================================= */

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"

const SIDEBAR_KEYBOARD_SHORTCUT = "b"

/* =========================================================
   TYPES
========================================================= */

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (
    open: boolean | ((open: boolean) => boolean)
  ) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

/* =========================================================
   CONTEXT
========================================================= */

const SidebarContext =
  React.createContext<SidebarContextProps | null>(null)

/* =========================================================
   HOOK
========================================================= */

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error(
      "useSidebar must be used within a SidebarProvider."
    )
  }

  return context
}

/* =========================================================
   SIDEBAR PROVIDER
========================================================= */

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()

  const [openMobile, setOpenMobile] =
    React.useState(false)

  const [_open, _setOpen] =
    React.useState(defaultOpen)

  const open = openProp ?? _open

  const setOpen = React.useCallback(
    (
      value:
        | boolean
        | ((value: boolean) => boolean)
    ) => {
      const openState =
        typeof value === "function"
          ? value(open)
          : value

      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      if (typeof document !== "undefined") {
        document.cookie =
          `${SIDEBAR_COOKIE_NAME}=${openState}; ` +
          `path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      }
    },
    [open, setOpenProp]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((current) => !current)
    } else {
      setOpen((current) => !current)
    }
  }, [isMobile, setOpen])

  /* =======================================================
     KEYBOARD SHORTCUT
  ======================================================= */

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [toggleSidebar])

  const state =
    open
      ? "expanded"
      : "collapsed"

  const contextValue =
    React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        toggleSidebar,
      ]
    )

  return (
    <SidebarContext.Provider
      value={contextValue}
    >
      <div
        data-slot="sidebar-wrapper"
        data-sidebar="wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon":
              SIDEBAR_WIDTH_ICON,
            "--sidebar-width-mobile":
              SIDEBAR_WIDTH_MOBILE,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full",
          "has-data-[variant=inset]:bg-sidebar",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const {
    isMobile,
    state,
    openMobile,
    setOpenMobile,
  } = useSidebar()

  /* =======================================================
     NON-COLLAPSIBLE
  ======================================================= */

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        data-sidebar="sidebar"
        data-state="expanded"
        className={cn(
          "flex h-full w-64 shrink-0",
          "flex-col bg-sidebar",
          "text-sidebar-foreground",
          className
        )}
        style={{
          width: SIDEBAR_WIDTH,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }

  /* =======================================================
     MOBILE
  ======================================================= */

  if (isMobile) {
    return (
      <Sheet
        open={openMobile}
        onOpenChange={setOpenMobile}
        {...props}
      >
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          side={side}
          className={cn(
            "w-72 bg-sidebar p-0",
            "text-sidebar-foreground",
            "[&>button]:hidden"
          )}
          style={{
            width: SIDEBAR_WIDTH_MOBILE,
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              Sidebar
            </SheetTitle>

            <SheetDescription>
              Displays the mobile sidebar.
            </SheetDescription>
          </SheetHeader>

          <div className="flex h-full w-full flex-col">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  /* =======================================================
     DESKTOP WIDTH
  ======================================================= */

  const sidebarWidth =
    state === "expanded"
      ? SIDEBAR_WIDTH
      : SIDEBAR_WIDTH_ICON

  /* =======================================================
     DESKTOP
  ======================================================= */

  return (
    <div
      className={cn(
        "group peer hidden text-sidebar-foreground md:block",
        "shrink-0"
      )}
      data-state={state}
      data-collapsible={
        state === "collapsed"
          ? collapsible
          : ""
      }
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* ===================================================
          SPACE RESERVED FOR FIXED SIDEBAR

          This is extremely important.

          The visible sidebar is fixed, but this element
          reserves its width in the flex layout so the
          Navbar/content NEVER goes underneath it.
      =================================================== */}

      <div
        data-slot="sidebar-gap"
        aria-hidden="true"
        className={cn(
          "relative shrink-0",
          "transition-[width]",
          "duration-200",
          "ease-linear"
        )}
        style={{
          width: sidebarWidth,
        }}
      />

      {/* ===================================================
          ACTUAL SIDEBAR
      =================================================== */}

      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-40",
          "hidden md:flex",
          "h-svh",
          "flex-col",
          "transition-[left,right,width]",
          "duration-200",
          "ease-linear",

          side === "left"
            ? "left-0"
            : "right-0",

          variant === "sidebar" &&
            side === "left" &&
            "border-r border-sidebar-border",

          variant === "sidebar" &&
            side === "right" &&
            "border-l border-sidebar-border",

          variant === "floating" &&
            "p-2",

          variant === "inset" &&
            "p-2"
        )}
        style={{
          width: sidebarWidth,
        }}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "flex size-full flex-col",
            "bg-sidebar",
            "text-sidebar-foreground",

            variant === "floating" &&
              "rounded-lg shadow-sm ring-1 ring-sidebar-border",

            variant === "inset" &&
              "rounded-lg"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   SIDEBAR TRIGGER
========================================================= */

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />

      <span className="sr-only">
        Toggle Sidebar
      </span>
    </Button>
  )
}

/* =========================================================
   SIDEBAR RAIL
========================================================= */

function SidebarRail({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      title="Toggle Sidebar"
      onClick={toggleSidebar}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4",
        "transition-all ease-linear",
        "sm:flex",

        "group-data-[side=left]:-right-4",
        "group-data-[side=right]:left-0",

        "after:absolute after:inset-y-0",
        "after:start-1/2",
        "after:w-[2px]",

        "hover:after:bg-sidebar-border",

        "group-data-[collapsible=offcanvas]:translate-x-0",

        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR INSET
========================================================= */

function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-w-0 flex-1",
        "flex-col",
        "bg-background",
        "overflow-hidden",

        variantInsetStyles,

        className
      )}
      {...props}
    />
  )
}

const variantInsetStyles =
  "md:peer-data-[variant=inset]:m-2 " +
  "md:peer-data-[variant=inset]:ml-0 " +
  "md:peer-data-[variant=inset]:rounded-xl " +
  "md:peer-data-[variant=inset]:shadow-sm " +
  "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2"

/* =========================================================
   SIDEBAR INPUT
========================================================= */

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn(
        "h-8 w-full",
        "bg-background",
        "shadow-none",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR HEADER
========================================================= */

function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-2 p-2",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR FOOTER
========================================================= */

function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2 p-2",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR SEPARATOR
========================================================= */

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(
        "mx-2 w-auto",
        "bg-sidebar-border",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR CONTENT
========================================================= */

function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar",
        "flex min-h-0 flex-1",
        "flex-col",
        "gap-0",
        "overflow-auto",
        "group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR GROUP
========================================================= */

function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full",
        "min-w-0 flex-col",
        "p-2",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR GROUP LABEL
========================================================= */

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> &
  React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0",
          "items-center",
          "rounded-md",
          "px-2",
          "text-xs",
          "font-medium",
          "text-sidebar-foreground/70",
          "outline-hidden",
          "transition-[margin,opacity]",
          "duration-200",
          "ease-linear",

          "group-data-[collapsible=icon]:-mt-8",
          "group-data-[collapsible=icon]:opacity-0",

          "[&>svg]:size-4",
          "[&>svg]:shrink-0",

          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  })
}

/* =========================================================
   SIDEBAR GROUP ACTION
========================================================= */

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute right-3 top-3.5",
          "flex aspect-square w-5",
          "items-center justify-center",
          "rounded-md p-0",
          "text-sidebar-foreground",
          "outline-hidden",

          "group-data-[collapsible=icon]:hidden",

          "hover:bg-sidebar-accent",
          "hover:text-sidebar-accent-foreground",

          "[&>svg]:size-4",
          "[&>svg]:shrink-0",

          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  })
}

/* =========================================================
   SIDEBAR GROUP CONTENT
========================================================= */

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn(
        "w-full text-sm",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR MENU
========================================================= */

function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-0",
        "flex-col gap-0",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR MENU ITEM
========================================================= */

function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn(
        "group/menu-item relative",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR MENU BUTTON VARIANTS
========================================================= */

const sidebarMenuButtonVariants = cva(
  [
    "peer/menu-button",
    "group/menu-button",
    "flex w-full",
    "items-center",
    "gap-2",
    "overflow-hidden",
    "rounded-md",
    "p-2",
    "text-left",
    "text-sm",
    "outline-hidden",

    "transition-[width,height,padding]",

    "hover:bg-sidebar-accent",
    "hover:text-sidebar-accent-foreground",

    "focus-visible:ring-2",

    "active:bg-sidebar-accent",
    "active:text-sidebar-accent-foreground",

    "disabled:pointer-events-none",
    "disabled:opacity-50",

    "data-active:bg-sidebar-accent",
    "data-active:font-medium",
    "data-active:text-sidebar-accent-foreground",

    "group-data-[collapsible=icon]:size-8!",
    "group-data-[collapsible=icon]:p-2!",

    "[&_svg]:size-4",
    "[&_svg]:shrink-0",

    "[&>span:last-child]:truncate",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",

        outline:
          "bg-background " +
          "shadow-[0_0_0_1px_var(--sidebar-border)] " +
          "hover:bg-sidebar-accent " +
          "hover:text-sidebar-accent-foreground",
      },

      size: {
        default:
          "h-8 text-sm",

        sm:
          "h-7 text-xs",

        lg:
          "h-12 text-sm " +
          "group-data-[collapsible=icon]:p-0!",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/* =========================================================
   SIDEBAR MENU BUTTON
========================================================= */

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean
    tooltip?:
      | string
      | React.ComponentProps<
          typeof TooltipContent
        >
  } &
  VariantProps<
    typeof sidebarMenuButtonVariants
  >) {
  const {
    isMobile,
    state,
  } = useSidebar()

  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          sidebarMenuButtonVariants({
            variant,
            size,
          }),
          className
        ),
      },
      props
    ),
    render:
      !tooltip
        ? render
        : (
            <TooltipTrigger
              render={render}
            />
          ),
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  })

  if (!tooltip) {
    return comp
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      {comp}

      <TooltipContent
        side="right"
        align="center"
        hidden={
          state !== "collapsed" ||
          isMobile
        }
        {...tooltip}
      />
    </Tooltip>
  )
}

/* =========================================================
   SIDEBAR MENU ACTION
========================================================= */

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute right-1 top-1.5",
          "flex aspect-square w-5",
          "items-center justify-center",
          "rounded-md p-0",
          "text-sidebar-foreground",
          "outline-hidden",

          "group-data-[collapsible=icon]:hidden",

          "hover:bg-sidebar-accent",
          "hover:text-sidebar-accent-foreground",

          showOnHover &&
            "opacity-0 " +
            "group-hover/menu-item:opacity-100",

          "[&>svg]:size-4",
          "[&>svg]:shrink-0",

          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  })
}

/* =========================================================
   SIDEBAR MENU BADGE
========================================================= */

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none",
        "absolute right-1",
        "flex h-5 min-w-5",
        "items-center justify-center",
        "rounded-md px-1",
        "text-xs font-medium",
        "text-sidebar-foreground",
        "tabular-nums",
        "select-none",

        "group-data-[collapsible=icon]:hidden",

        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR MENU SKELETON
========================================================= */

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  const [width] = React.useState(
    () =>
      `${Math.floor(
        Math.random() * 40
      ) + 50}%`
  )

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn(
        "flex h-8 items-center",
        "gap-2 rounded-md px-2",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}

      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

/* =========================================================
   SIDEBAR MENU SUB
========================================================= */

function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5",
        "flex min-w-0",
        "translate-x-px",
        "flex-col gap-1",
        "border-l border-sidebar-border",
        "px-2.5 py-0.5",

        "group-data-[collapsible=icon]:hidden",

        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR MENU SUB ITEM
========================================================= */

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn(
        "group/menu-sub-item relative",
        className
      )}
      {...props}
    />
  )
}

/* =========================================================
   SIDEBAR MENU SUB BUTTON
========================================================= */

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md"
    isActive?: boolean
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0",
          "items-center gap-2",
          "overflow-hidden",
          "rounded-md",
          "px-2",
          "text-sidebar-foreground",
          "outline-hidden",

          "hover:bg-sidebar-accent",
          "hover:text-sidebar-accent-foreground",

          "focus-visible:ring-2",

          "active:bg-sidebar-accent",
          "active:text-sidebar-accent-foreground",

          "group-data-[collapsible=icon]:hidden",

          "data-active:bg-sidebar-accent",
          "data-active:text-sidebar-accent-foreground",

          "data-[size=md]:text-sm",
          "data-[size=sm]:text-xs",

          "[&>span:last-child]:truncate",
          "[&>svg]:size-4",
          "[&>svg]:shrink-0",

          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  })
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}