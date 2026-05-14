"use client"

import { User, Mail, ChevronRight, Bell, Shield, HelpCircle, Info, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AccountPageProps {
  onEmailSettings: () => void
}

export function AccountPage({ onEmailSettings }: AccountPageProps) {
  const currentEmail = "invoice_5x8k@fapiao.ai"

  return (
    <div className="px-4 space-y-4">
      {/* 用户头像卡片 */}
      <div className="bg-card rounded-2xl p-5 border border-border/50">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-[#0052D9]/20">
            <AvatarImage src="/avatar.png" alt="用户头像" />
            <AvatarFallback className="bg-[#0052D9]/10 text-[#0052D9] text-lg font-semibold">
              张
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">张明</h2>
            <p className="text-sm text-muted-foreground">财务部 · 高级会计师</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">企业已认证</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* 收件邮箱设置 - 核心入口 */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <button
          onClick={onEmailSettings}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0052D9]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#0052D9]" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">收件邮箱</p>
              <p className="text-xs text-muted-foreground truncate">{currentEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#0052D9] font-medium">修改</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* 其他设置项 */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
        {[
          { icon: Bell, label: "通知设置", desc: "已开启发票提醒" },
          { icon: Shield, label: "隐私与安全", desc: "管理数据权限" },
          { icon: HelpCircle, label: "帮助与反馈", desc: "常见问题解答" },
          { icon: Info, label: "关于", desc: "版本 1.0.0" },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* 退出登录 */}
      <button className="w-full bg-card rounded-2xl border border-border/50 p-4 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/5 transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">退出登录</span>
      </button>
    </div>
  )
}
