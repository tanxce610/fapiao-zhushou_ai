"use client"

import { useMemo, useState } from "react"
import { Search, Filter, Calendar, ChevronDown, X, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SavedReimbursementLine = {
  id: number
  projectName: string
  invoiceDate: string
  amount: number
}

export type SavedReimbursementForm = {
  id: string
  name: string
  /** YYYY-MM-DD */
  createdAt: string
  total: number
  count: number
  invoiceIds?: number[]
  lines?: SavedReimbursementLine[]
}

interface ReimbursementListProps {
  items: SavedReimbursementForm[]
  onOpenDetail: (form: SavedReimbursementForm) => void
}

function formatCreatedDisplay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return ymd
  return `${y}年${String(m).padStart(2, "0")}月${String(d).padStart(2, "0")}日`
}

export function ReimbursementList({ items, onOpenDetail }: ReimbursementListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [createdStart, setCreatedStart] = useState("")
  const [createdEnd, setCreatedEnd] = useState("")

  const hasDateFilter = Boolean(createdStart || createdEnd)

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const q = searchQuery.trim().toLowerCase()
        const nameMatch = !q || item.name.toLowerCase().includes(q)
        const startOk = !createdStart || item.createdAt >= createdStart
        const endOk = !createdEnd || item.createdAt <= createdEnd
        return nameMatch && startOk && endOk
      })
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt < b.createdAt ? 1 : -1
        }
        return a.id < b.id ? 1 : -1
      })
  }, [items, searchQuery, createdStart, createdEnd])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索报销单名称"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/60 border-0 rounded-xl text-sm placeholder:text-muted-foreground/60 focus-visible:ring-[#0052D9]/30"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-y border-border bg-card">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pointer-events-none">
          <Calendar className="w-3.5 h-3.5" />
          <span>创建日期</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          <span className="text-[10px] text-muted-foreground/80">（新→旧）</span>
        </div>
        <button
          type="button"
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={cn(
            "flex items-center gap-1 text-xs transition-colors",
            showFilterPanel || hasDateFilter ? "text-[#0052D9]" : "text-muted-foreground"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>筛选</span>
        </button>
      </div>

      {showFilterPanel && (
        <div className="px-4 py-3 bg-card border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">创建日期</span>
            <div className="flex flex-1 items-center gap-1.5">
              <input
                type="date"
                value={createdStart}
                onChange={(e) => setCreatedStart(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 rounded-lg text-xs text-foreground border-0 outline-none focus:ring-1 focus:ring-[#0052D9]/40"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <input
                type="date"
                value={createdEnd}
                onChange={(e) => setCreatedEnd(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 rounded-lg text-xs text-foreground border-0 outline-none focus:ring-1 focus:ring-[#0052D9]/40"
              />
            </div>
          </div>
          {hasDateFilter && (
            <button
              type="button"
              onClick={() => {
                setCreatedStart("")
                setCreatedEnd("")
              }}
              className="flex items-center gap-1 text-xs text-[#0052D9]"
            >
              <X className="w-3 h-3" />
              清除筛选条件
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">暂无报销单</p>
            <p className="text-xs mt-1 text-center text-muted-foreground/80">
              在发票夹中选择发票并点击「报销」即可生成
            </p>
          </div>
        ) : (
          filtered.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => onOpenDetail(form)}
              className="w-full text-left bg-card rounded-xl p-4 border border-border/50 shadow-sm transition-colors hover:border-[#0052D9]/30 hover:bg-secondary/20 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {form.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                创建时间：{formatCreatedDisplay(form.createdAt)}
              </p>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">金额合计</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">
                    ¥{form.total.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground mb-0.5">发票张数</p>
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {form.count} 张
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
