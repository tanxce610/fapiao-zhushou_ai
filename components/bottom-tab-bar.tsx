"use client"

import { MessageCircle, Folder, User, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"

export type MainTabId = "chat" | "folder" | "reimbursements" | "account"

interface BottomTabBarProps {
  activeTab: MainTabId
  onTabChange: (tab: MainTabId) => void
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const tabs: { id: MainTabId; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: "对话", icon: MessageCircle },
    { id: "folder", label: "发票夹", icon: Folder },
    { id: "reimbursements", label: "报销单", icon: FileSpreadsheet },
    { id: "account", label: "账户", icon: User },
  ]

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-20 h-20 border-t border-border bg-card/95 backdrop-blur-lg">
      <div className="flex h-full items-stretch px-1 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors",
                isActive ? "text-[#0052D9]" : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-all",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
