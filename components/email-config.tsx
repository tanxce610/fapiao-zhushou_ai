"use client"

import { useState } from "react"
import { Mail, Key, RefreshCw, CheckCircle2, Shield, ChevronRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface EmailConfigProps {
  onViewHistory?: () => void
}

export function EmailConfig({ onViewHistory }: EmailConfigProps) {
  const [email, setEmail] = useState("")
  const [authCode, setAuthCode] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 2000)
  }

  return (
    <div className="px-4 space-y-6">
      {/* 已连接状态 */}
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">已连接邮箱</p>
            <p className="text-sm text-muted-foreground">work@company.com</p>
          </div>
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
          <Shield className="w-4 h-4" />
          <span>上次同步：5 分钟前 · 发现 3 张新发票</span>
        </div>
      </div>

      {/* 添加新邮箱表单 */}
      <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-5">
        <h3 className="font-semibold text-foreground text-base">添加新邮箱</h3>
        
        <div className="space-y-4">
          {/* 邮箱地址 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0052D9]" />
              邮箱地址
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-0 px-4 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-[#0052D9]"
            />
          </div>

          {/* 授权码 */}
          <div className="space-y-2">
            <Label htmlFor="authCode" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0052D9]" />
              授权码
            </Label>
            <Input
              id="authCode"
              type="password"
              placeholder="请输入邮箱授权码"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-0 px-4 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-[#0052D9]"
            />
            <p className="text-xs text-muted-foreground pl-1">
              授权码非邮箱密码，请在邮箱设置中获取
            </p>
          </div>
        </div>

        {/* 同步按钮 */}
        <Button
          onClick={handleSync}
          disabled={isSyncing || !email || !authCode}
          className={cn(
            "w-full h-12 rounded-xl text-white font-medium text-sm transition-all",
            "bg-gradient-to-r from-[#0052D9] to-[#3B82F6] hover:opacity-90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              正在同步...
            </>
          ) : (
            "立即同步"
          )}
        </Button>
      </div>

      {/* 功能入口 */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <button
          onClick={onViewHistory}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0052D9]/10 flex items-center justify-center">
              <History className="w-4.5 h-4.5 text-[#0052D9]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">邮件导入记录</p>
              <p className="text-xs text-muted-foreground">查看历史导入状态</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* 帮助链接 */}
      <div className="space-y-2">
        {[
          { label: "如何获取邮箱授权码？", href: "#" },
          { label: "支持的邮箱类型", href: "#" },
          { label: "隐私与数据安全", href: "#" },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center justify-between py-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{item.label}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
