"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderOpen,
  FileText,
  Paperclip,
  Shield,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FolderImportFilter } from "@/components/invoice-list"

interface ImportRecord {
  id: string
  senderEmail: string
  fileCount: number
  fileNames: string[]
  status: "success" | "failed"
  failureReason?: string
  importTime: string
}

const mockRecords: ImportRecord[] = [
  {
    id: "1",
    senderEmail: "invoice@aliyun.com",
    fileCount: 3,
    fileNames: ["阿里云服务费发票.pdf", "域名续费发票.pdf", "CDN服务发票.pdf"],
    status: "success",
    importTime: "10:32",
  },
  {
    id: "2",
    senderEmail: "billing@tencent.com",
    fileCount: 1,
    fileNames: ["腾讯云账单.pdf"],
    status: "failed",
    failureReason: "非发票类 PDF 文件",
    importTime: "10:15",
  },
  {
    id: "3",
    senderEmail: "fapiao@didi.com",
    fileCount: 2,
    fileNames: ["滴滴出行发票_0512.jpg", "滴滴出行发票_0513.jpg"],
    status: "success",
    importTime: "09:48",
  },
  {
    id: "4",
    senderEmail: "receipt@meituan.com",
    fileCount: 1,
    fileNames: ["美团外卖订单截图.png"],
    status: "failed",
    failureReason: "图片模糊无法识别",
    importTime: "09:30",
  },
  {
    id: "5",
    senderEmail: "service@jd.com",
    fileCount: 2,
    fileNames: ["京东电子发票.pdf", "京东订单详情.pdf"],
    status: "success",
    importTime: "08:45",
  },
]

interface EmailImportHistoryProps {
  onBack: () => void
  onViewInFolder: (payload: FolderImportFilter) => void
  /** 跳转邮箱设置（修改收票邮箱） */
  onOpenEmailSettings: () => void
}

const RECEIVING_EMAIL = "work@company.com"

function formatSyncTimeLabel(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EmailImportHistory({
  onBack,
  onViewInFolder,
  onOpenEmailSettings,
}: EmailImportHistoryProps) {
  const [records, setRecords] = useState(mockRecords)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState(() => new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  /** 成功导入的附件张数（演示用：按比例拆成「新增 / 重复」） */
  const successSheets = useMemo(
    () => records.filter((r) => r.status === "success").reduce((acc, r) => acc + r.fileCount, 0),
    [records]
  )
  /** 失败附件张数 */
  const failedSheets = useMemo(
    () => records.filter((r) => r.status === "failed").reduce((acc, r) => acc + r.fileCount, 0),
    [records]
  )
  const { newSheets, duplicateSheets } = useMemo(() => {
    const total = successSheets
    if (total === 0) return { newSheets: 0, duplicateSheets: 0 }
    const duplicate = Math.min(Math.floor(total * 0.35), Math.max(0, total - 1))
    return { newSheets: total - duplicate, duplicateSheets: duplicate }
  }, [successSheets])

  const handleRefreshList = () => {
    setIsRefreshing(true)
    window.setTimeout(() => {
      setLastSyncAt(new Date())
      setRecords((prev) => {
        const next = [...prev]
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[next[i], next[j]] = [next[j], next[i]]
        }
        return next
      })
      setIsRefreshing(false)
    }, 650)
  }

  const handleRetry = (id: string) => {
    setRetryingId(id)
    setTimeout(() => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "success" as const, failureReason: undefined }
            : r
        )
      )
      setRetryingId(null)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 页面标题 */}
      <header className="px-4 py-3 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">邮件导入记录</h1>
      </header>

      {/* 滚动内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 收票邮箱卡片（参考「已连接邮箱」样式） */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">收票邮箱</p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{RECEIVING_EMAIL}</p>
                    <button
                      type="button"
                      onClick={onOpenEmailSettings}
                      className="inline-flex items-center gap-0.5 shrink-0 h-6 pl-1.5 pr-2 rounded-md border border-[#0052D9]/35 bg-background text-[11px] font-medium text-[#0052D9] hover:bg-[#0052D9]/8 active:scale-[0.98] transition-colors"
                    >
                      <Pencil className="w-3 h-3 opacity-90" />
                      修改
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefreshList}
                disabled={isRefreshing}
                className={cn(
                  "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  "bg-[#0052D9]/10 text-[#0052D9] hover:bg-[#0052D9]/18 hover:shadow-md",
                  "ring-1 ring-[#0052D9]/20 disabled:opacity-55 disabled:pointer-events-none"
                )}
                aria-label="刷新列表"
              >
                <RefreshCw className={cn("w-6 h-6 stroke-[2.25px]", isRefreshing && "animate-spin")} />
              </button>
            </div>
          </div>
          <div className="mx-3 mb-3 rounded-xl bg-secondary/70 px-3 py-2.5 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-1.5 text-[11px] leading-snug text-muted-foreground">
              <p>
                <span className="text-foreground/80">最近同步：</span>
                <span className="text-foreground/90 tabular-nums">{formatSyncTimeLabel(lastSyncAt)}</span>
              </p>
              <p className="flex flex-wrap items-baseline gap-x-0.5 gap-y-0.5">
                <span>新增</span>
                <span className="text-base font-bold tabular-nums text-[#0052D9] mx-0.5">{newSheets}</span>
                <span>张，重复</span>
                <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-500 mx-0.5">
                  {duplicateSheets}
                </span>
                <span>张，失败</span>
                <span className="text-base font-bold tabular-nums text-red-600 dark:text-red-400 mx-0.5">
                  {failedSheets}
                </span>
                <span>张</span>
              </p>
            </div>
          </div>
        </div>

        {/* 记录列表 */}
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className={cn(
                "bg-card rounded-2xl p-4 border transition-all",
                record.status === "success"
                  ? "border-border/50"
                  : "border-red-200 bg-red-50/30"
              )}
            >
              {/* 发件人信息 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">发件人</span>
                    <span className="text-xs text-muted-foreground/60">{record.importTime}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {record.senderEmail}
                  </p>
                </div>
                {/* 状态标签 */}
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    record.status === "success"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-100 text-red-600"
                  )}
                >
                  {record.status === "success" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      成功
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      失败
                    </>
                  )}
                </div>
              </div>

              {/* 文件信息 */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>共 {record.fileCount} 个附件</span>
                </div>
                <div className="space-y-1.5">
                  {record.fileNames.map((fileName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-foreground/80 bg-secondary/50 rounded-lg px-3 py-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0052D9]" />
                      <span className="truncate">{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 失败原因 */}
              {record.status === "failed" && record.failureReason && (
                <div className="mb-3 px-3 py-2 bg-red-100/50 rounded-lg">
                  <p className="text-xs text-red-600">
                    <span className="font-medium">失败原因：</span>
                    {record.failureReason}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                {record.status === "failed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(record.id)}
                    disabled={retryingId === record.id}
                    className="h-8 px-3 text-xs rounded-lg border-[#0052D9] text-[#0052D9] hover:bg-[#0052D9]/5"
                  >
                    {retryingId === record.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        重试中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        重试
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onViewInFolder({
                        importRecordId: record.id,
                        senderEmail: record.senderEmail,
                      })
                    }
                    className="h-8 px-3 text-xs text-[#0052D9] hover:bg-[#0052D9]/5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                    在发票夹中查看
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
