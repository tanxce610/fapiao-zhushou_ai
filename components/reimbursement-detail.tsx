"use client"

import { ArrowLeft, ChevronRight, FileSpreadsheet, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SavedReimbursementForm } from "@/components/reimbursement-list"

function invoiceDateCompact(iso: string): string {
  return iso.replace(/-/g, "")
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "报销单"
}

/** 导出为 UTF-8 CSV（Excel 可直接打开） */
export function exportReimbursementAsExcelCsv(form: SavedReimbursementForm): void {
  const BOM = "\uFEFF"
  const lines = form.lines ?? []
  const rows: string[][] = [
    ["报销单名称", form.name],
    ["创建日期", form.createdAt],
    ["合计金额", form.total.toFixed(2)],
    ["发票张数", String(form.count)],
    [],
    ["项目名称", "开票日期", "金额(元)"],
    ...lines.map((l) => [l.projectName, l.invoiceDate, l.amount.toFixed(2)]),
  ]
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${sanitizeFilename(form.name)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface ReimbursementDetailProps {
  form: SavedReimbursementForm
  onBack: () => void
  onDelete: (formId: string, invoiceIds: number[]) => void
}

export function ReimbursementDetail({ form, onBack, onDelete }: ReimbursementDetailProps) {
  const lines = form.lines ?? []
  const total = lines.length > 0 ? lines.reduce((a, l) => a + l.amount, 0) : form.total
  const count = lines.length > 0 ? lines.length : form.count

  const handleDelete = () => {
    if (typeof window !== "undefined" && !window.confirm("确定删除该报销单？删除后关联发票将恢复为「未关联报销」。")) {
      return
    }
    onDelete(form.id, form.invoiceIds ?? [])
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">报销单详情</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-lg font-semibold leading-snug text-foreground">{form.name}</h2>
          <p className="mt-2 text-xs text-muted-foreground">创建日期：{form.createdAt}</p>
        </div>

        <div className="mt-5 border-b border-border pb-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] text-muted-foreground">
            <span>项目名称</span>
            <span className="w-[72px] text-center">开票日期</span>
            <span className="w-[76px] text-right">金额</span>
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无明细（旧数据或未保存行项目）</p>
        ) : (
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-end justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">合计</span>
          <div className="flex items-baseline gap-4">
            <span className="text-base font-bold tabular-nums text-foreground">¥{total.toFixed(2)}</span>
            <span className="text-base font-semibold tabular-nums text-foreground">{count}张</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-card px-4 py-3 pb-6">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl border-border"
          onClick={() => exportReimbursementAsExcelCsv(form)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          导出 Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/5"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          删除报销单
        </Button>
      </div>
    </div>
  )
}
