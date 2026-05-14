"use client"

import { useState } from "react"
import { ArrowLeft, Mail, Key, RefreshCw, History, ChevronRight, HelpCircle, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface EmailSettingsProps {
  onBack: () => void
  onViewHistory: () => void
}

export function EmailSettings({ onBack, onViewHistory }: EmailSettingsProps) {
  const [email, setEmail] = useState("")
  const [authCode, setAuthCode] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 页面头部 */}
      <header className="flex items-center gap-3 px-4 py-4 bg-card border-b border-border">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">邮箱设置</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-4">
          {/* Card 1: 邮箱表单 */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl bg-[#0052D9]/10 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-[#0052D9]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">收件邮箱配置</h3>
                <p className="text-xs text-muted-foreground">用于接收发票邮件并自动导入</p>
              </div>
            </div>
            
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
              </div>
            </div>

            {/* 同步按钮 */}
            <Button
              onClick={handleSync}
              disabled={isSyncing || !email || !authCode}
              className={cn(
                "w-full h-12 rounded-xl text-white font-medium text-sm transition-all",
                "bg-[#0052D9] hover:bg-[#0052D9]/90",
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

          {/* Card 2: 邮件导入记录入口 */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <button
              onClick={onViewHistory}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0052D9]/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-[#0052D9]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">邮件导入记录</p>
                  <p className="text-xs text-muted-foreground">查看历史导入状态与详情</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Footer: 帮助链接 */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">如何获取邮箱授权码？</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">支持的邮箱类型</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
