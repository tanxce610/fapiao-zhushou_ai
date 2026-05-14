"use client"

import { useEffect, useState } from "react"
import { Pencil, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type ReimbursementPreviewLine = {
  id: number
  projectName: string
  invoiceDate: string
  amount: number
}

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function invoiceDateCompact(iso: string): string {
  return iso.replace(/-/g, "")
}

interface ReimbursementPreviewDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (payload: {
    name: string
    createdAt: string
    total: number
    count: number
    invoiceIds: number[]
    lines: ReimbursementPreviewLine[]
  }) => void
  lines: ReimbursementPreviewLine[]
}

export function ReimbursementPreviewDialog({
  open,
  onClose,
  onConfirm,
  lines,
}: ReimbursementPreviewDialogProps) {
  const [formName, setFormName] = useState("")
  const [creationDate, setCreationDate] = useState("")
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    if (open) {
      const d = todayYmd()
      setCreationDate(d)
      setFormName(`${d}报销单`)
      setEditingName(false)
    }
  }, [open])

  if (!open) return null

  const total = lines.reduce((acc, l) => acc + l.amount, 0)
  const count = lines.length

  const handleConfirm = () => {
    if (lines.length === 0) return
    const name = formName.trim() || `${creationDate}报销单`
    onConfirm({
      name,
      createdAt: creationDate,
      total,
      count,
      invoiceIds: lines.map((l) => l.id),
      lines: lines.map((l) => ({
        id: l.id,
        projectName: l.projectName,
        invoiceDate: l.invoiceDate,
        amount: l.amount,
      })),
    })
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/45"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-x-0 bottom-0 top-[8%] z-[56] mx-auto flex max-w-[375px] flex-col px-3 pb-4 sm:inset-y-8 sm:top-auto sm:max-h-[85vh]">
        <div
          className="flex max-h-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-end border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex items-start gap-2 border-b border-border pb-3">
              {editingName ? (
                <Input
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  className="h-10 flex-1 border-0 border-b border-[#0052D9] px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                />
              ) : (
                <h2 className="flex-1 text-lg font-semibold leading-snug text-foreground">
                  {formName.trim() || `${creationDate}报销单`}
                </h2>
              )}
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="编辑报销单名称"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">创建日期：{creationDate}</p>

            <div className="mt-5 border-b border-border pb-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] text-muted-foreground">
                <span>项目名称</span>
                <span className="w-[72px] text-center">开票日期</span>
                <span className="w-[76px] text-right">金额</span>
              </div>
            </div>

            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-3 text-sm"
                >
                  <span className="min-w-0 truncate text-foreground">{line.projectName}</span>
                  <span className="w-[72px] text-center text-xs tabular-nums text-foreground">
                    {invoiceDateCompact(line.invoiceDate)}
                  </span>
                  <span className="flex w-[76px] items-center justify-end gap-0.5 tabular-nums text-foreground">
                    ¥{line.amount.toFixed(2)}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-end justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">合计</span>
              <div className="flex items-baseline gap-4">
                <span className="text-base font-bold tabular-nums text-foreground">¥{total.toFixed(2)}</span>
                <span className="text-base font-semibold tabular-nums text-foreground">{count}张</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-card px-4 py-3">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl border-border"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[#0052D9] hover:bg-[#0052D9]/90"
                onClick={handleConfirm}
              >
                确定
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
