"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, Calendar, Check, Plus, Trash2, ChevronDown, X, FileUp, Camera, Mail, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReimbursementPreviewDialog, type ReimbursementPreviewLine } from "@/components/reimbursement-preview-dialog"
import type { SavedReimbursementForm } from "@/components/reimbursement-list"
import { cn } from "@/lib/utils"

export interface Invoice {
  id: number
  merchant: string
  amount: number
  invoiceDate: string
  importDate: string
  category: "travel" | "food" | "office"
  buyer: string
  status: "linked" | "unlinked"
  /** 对应邮件导入记录 id，用于从导入记录跳转筛选 */
  emailImportRecordId?: string
}

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 1,
    merchant: "福建省德化祥业文化传播有限公司",
    amount: 128.00,
    invoiceDate: "2026-03-14",
    importDate: "2026-03-15",
    category: "office",
    buyer: "南宁市宁檬数据科技有限公司",
    status: "unlinked",
    emailImportRecordId: "1",
  },
  {
    id: 2,
    merchant: "中国国际航空股份有限公司",
    amount: 1580.00,
    invoiceDate: "2026-03-10",
    importDate: "2026-03-11",
    category: "travel",
    buyer: "南宁市宁檬数据科技有限公司",
    status: "linked",
    emailImportRecordId: "1",
  },
  {
    id: 3,
    merchant: "海底捞火锅餐饮管理有限公司",
    amount: 298.00,
    invoiceDate: "2026-03-12",
    importDate: "2026-03-13",
    category: "food",
    buyer: "南宁市宁檬数据科技有限公司",
    status: "unlinked",
    emailImportRecordId: "3",
  },
  {
    id: 4,
    merchant: "如家酒店连锁经营有限公司",
    amount: 368.00,
    invoiceDate: "2026-03-08",
    importDate: "2026-03-09",
    category: "travel",
    buyer: "南宁市宁檬数据科技有限公司",
    status: "linked",
    emailImportRecordId: "1",
  },
  {
    id: 5,
    merchant: "星巴克企业管理（中国）有限公司",
    amount: 68.00,
    invoiceDate: "2026-03-11",
    importDate: "2026-03-12",
    category: "food",
    buyer: "南宁市宁檬数据科技有限公司",
    status: "unlinked",
  },
  {
    id: 6,
    merchant: "京东世纪贸易有限公司",
    amount: 899.00,
    invoiceDate: "2026-03-07",
    importDate: "2026-03-08",
    category: "office",
    buyer: "南宁市宁檬数据科技有限公司",
    status: "unlinked",
    emailImportRecordId: "5",
  },
]

const categoryConfig = {
  travel: { label: "差旅费", color: "bg-blue-50 text-blue-600 border-blue-200" },
  food: { label: "餐饮费", color: "bg-orange-50 text-orange-600 border-orange-200" },
  office: { label: "材料费", color: "bg-purple-50 text-purple-600 border-purple-200" },
}

const statusFilters = [
  { id: "unlinked", label: "未关联报销" },
  { id: "linked", label: "已关联报销" },
  { id: "all", label: "全部" },
]

const categoryFilters = [
  { id: "travel", label: "差旅" },
  { id: "food", label: "餐饮" },
  { id: "office", label: "办公" },
]

export type FolderImportFilter = { importRecordId: string; senderEmail: string }

interface InvoiceListProps {
  onEmailImport?: () => void
  /** 从邮件导入记录跳转时，仅展示该批次关联的发票 */
  folderImportFilter?: FolderImportFilter | null
  onClearFolderImportFilter?: () => void
  /** 报销单生成成功后写入全局列表 */
  onReimbursementCreated?: (form: SavedReimbursementForm) => void
  /** 由父级注册：删除报销单时恢复发票为未关联 */
  onRegisterUnlinkInvoices?: (fn: ((ids: number[]) => void) | null) => void
  /** 由父级注册：从对话等入口将发票标为已关联报销 */
  onRegisterLinkInvoices?: (fn: ((ids: number[]) => void) | null) => void
}

export function InvoiceList({
  onEmailImport,
  folderImportFilter = null,
  onClearFolderImportFilter,
  onReimbursementCreated,
  onRegisterUnlinkInvoices,
  onRegisterLinkInvoices,
}: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeQuickFilter, setActiveQuickFilter] = useState("unlinked")
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([])
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [invoiceStartDate, setInvoiceStartDate] = useState("")
  const [invoiceEndDate, setInvoiceEndDate] = useState("")
  const [importStartDate, setImportStartDate] = useState("")
  const [importEndDate, setImportEndDate] = useState("")
  const [invoiceRecords, setInvoiceRecords] = useState<Invoice[]>(INITIAL_INVOICES)
  const [showReimbursementPreview, setShowReimbursementPreview] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  useEffect(() => {
    const unlink = (ids: number[]) => {
      if (!ids.length) return
      setInvoiceRecords((prev) =>
        prev.map((inv) =>
          ids.includes(inv.id) ? { ...inv, status: "unlinked" as const } : inv
        )
      )
    }
    onRegisterUnlinkInvoices?.(unlink)
    return () => onRegisterUnlinkInvoices?.(null)
  }, [onRegisterUnlinkInvoices])

  useEffect(() => {
    const link = (ids: number[]) => {
      if (!ids.length) return
      setInvoiceRecords((prev) =>
        prev.map((inv) =>
          ids.includes(inv.id) ? { ...inv, status: "linked" as const } : inv
        )
      )
    }
    onRegisterLinkInvoices?.(link)
    return () => onRegisterLinkInvoices?.(null)
  }, [onRegisterLinkInvoices])

  // 按开票时间降序排序 + 筛选
  const filteredInvoices = useMemo(() => {
    return invoiceRecords
      .filter((invoice) => {
        const importBatchMatch =
          !folderImportFilter ||
          invoice.emailImportRecordId === folderImportFilter.importRecordId

        const searchMatch =
          invoice.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categoryConfig[invoice.category].label.includes(searchQuery)

        const quickFilterRelaxed = folderImportFilter != null
        const quickFilterMatch =
          quickFilterRelaxed ||
          activeQuickFilter === "all" ||
          (activeQuickFilter === "linked" && invoice.status === "linked") ||
          (activeQuickFilter === "unlinked" && invoice.status === "unlinked")

        const categoryMatch = !filterCategory || invoice.category === filterCategory

        const invoiceDateMatch =
          (!invoiceStartDate || invoice.invoiceDate >= invoiceStartDate) &&
          (!invoiceEndDate || invoice.invoiceDate <= invoiceEndDate)

        const importDateMatch =
          (!importStartDate || invoice.importDate >= importStartDate) &&
          (!importEndDate || invoice.importDate <= importEndDate)

        return (
          importBatchMatch &&
          searchMatch &&
          quickFilterMatch &&
          categoryMatch &&
          invoiceDateMatch &&
          importDateMatch
        )
      })
      .sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1))
  }, [
    searchQuery,
    activeQuickFilter,
    filterCategory,
    invoiceStartDate,
    invoiceEndDate,
    importStartDate,
    importEndDate,
    folderImportFilter,
    invoiceRecords,
  ])

  const isAllSelected = filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedInvoices.includes(inv.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(filteredInvoices.map((inv) => inv.id))
    }
  }

  const toggleInvoiceSelection = (id: number) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleDelete = () => {
    setSelectedInvoices([])
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`
  }

  const currentStatusLabel = statusFilters.find((f) => f.id === activeQuickFilter)?.label || "未关联报销"

  const hasActiveFilter = filterCategory || invoiceStartDate || invoiceEndDate || importStartDate || importEndDate

  const reimbursementLines: ReimbursementPreviewLine[] = useMemo(() => {
    return invoiceRecords
      .filter((inv) => selectedInvoices.includes(inv.id))
      .sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1))
      .map((inv) => ({
        id: inv.id,
        projectName: inv.merchant,
        invoiceDate: inv.invoiceDate,
        amount: inv.amount,
      }))
  }, [invoiceRecords, selectedInvoices])

  const handleReimbursementConfirm = (payload: {
    name: string
    createdAt: string
    total: number
    count: number
    invoiceIds: number[]
    lines: ReimbursementPreviewLine[]
  }) => {
    setInvoiceRecords((prev) =>
      prev.map((inv) =>
        payload.invoiceIds.includes(inv.id) ? { ...inv, status: "linked" as const } : inv
      )
    )
    const lines: NonNullable<SavedReimbursementForm["lines"]> = payload.lines.map((l) => ({
      id: l.id,
      projectName: l.projectName,
      invoiceDate: l.invoiceDate,
      amount: l.amount,
    }))
    const form: SavedReimbursementForm = {
      id: `rb-${Date.now()}`,
      name: payload.name,
      createdAt: payload.createdAt,
      total: payload.total,
      count: payload.count,
      invoiceIds: payload.invoiceIds,
      lines,
    }
    onReimbursementCreated?.(form)
    setSelectedInvoices([])
    setShowReimbursementPreview(false)
  }

  const addMenuItems = [
    { id: "file", icon: FileUp, label: "文件导入", desc: "从本地上传发票" },
    { id: "camera", icon: Camera, label: "拍照上传", desc: "拍摄纸质发票" },
    { id: "email", icon: Mail, label: "邮件导入", desc: "从邮箱同步发票" },
  ]

  const handleAddMenuClick = (itemId: string) => {
    setShowAddMenu(false)
    if (itemId === "email" && onEmailImport) {
      onEmailImport()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {folderImportFilter && (
        <div className="mx-4 mt-2 mb-1 flex items-start gap-2 rounded-xl border border-[#0052D9]/25 bg-[#0052D9]/8 px-3 py-2.5">
          <Mail className="w-4 h-4 text-[#0052D9] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground">本封邮件导入的发票</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              发件人 {folderImportFilter.senderEmail}
            </p>
          </div>
          {onClearFolderImportFilter && (
            <button
              type="button"
              onClick={onClearFolderImportFilter}
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-background/80 hover:text-foreground"
              aria-label="清除筛选"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 搜索框 */}
      <div className="px-4 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索（购销方、货物/服务、分类）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/60 border-0 rounded-xl text-sm placeholder:text-muted-foreground/60 focus-visible:ring-[#0052D9]/30"
          />
        </div>
      </div>

      {/* 工具栏：状态下拉 + 排序 + 筛选 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-y border-border bg-card">
        {/* 状态筛选下拉 */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052D9] text-white text-xs font-medium"
          >
            <span>{currentStatusLabel}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showStatusDropdown && "rotate-180")} />
          </button>
          
          {showStatusDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowStatusDropdown(false)} 
              />
              <div className="absolute top-full left-0 mt-1 py-1 bg-card rounded-lg shadow-lg border border-border z-20 min-w-[120px]">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setActiveQuickFilter(filter.id)
                      setShowStatusDropdown(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs transition-colors",
                      activeQuickFilter === filter.id
                        ? "bg-[#0052D9]/10 text-[#0052D9] font-medium"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 排序 + 筛选 */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>开票时间</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              showFilterPanel || hasActiveFilter ? "text-[#0052D9]" : "text-muted-foreground"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>筛选</span>
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilterPanel && (
        <div className="px-4 py-3 bg-card border-b border-border space-y-3">
          {/* 开票日期 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">开票日期</span>
            <div className="flex flex-1 items-center gap-1.5">
              <input
                type="date"
                value={invoiceStartDate}
                onChange={(e) => setInvoiceStartDate(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 rounded-lg text-xs text-foreground border-0 outline-none focus:ring-1 focus:ring-[#0052D9]/40"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <input
                type="date"
                value={invoiceEndDate}
                onChange={(e) => setInvoiceEndDate(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 rounded-lg text-xs text-foreground border-0 outline-none focus:ring-1 focus:ring-[#0052D9]/40"
              />
            </div>
          </div>

          {/* 导入日期 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">导入日期</span>
            <div className="flex flex-1 items-center gap-1.5">
              <input
                type="date"
                value={importStartDate}
                onChange={(e) => setImportStartDate(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 rounded-lg text-xs text-foreground border-0 outline-none focus:ring-1 focus:ring-[#0052D9]/40"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <input
                type="date"
                value={importEndDate}
                onChange={(e) => setImportEndDate(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 rounded-lg text-xs text-foreground border-0 outline-none focus:ring-1 focus:ring-[#0052D9]/40"
              />
            </div>
          </div>

          {/* 分类 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">分类</span>
            <div className="flex gap-2">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filterCategory === cat.id
                      ? "bg-[#0052D9] text-white"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 清除筛选 */}
          {hasActiveFilter && (
            <button
              onClick={() => {
                setFilterCategory(null)
                setInvoiceStartDate("")
                setInvoiceEndDate("")
                setImportStartDate("")
                setImportEndDate("")
              }}
              className="flex items-center gap-1 text-xs text-[#0052D9]"
            >
              <X className="w-3 h-3" />
              清除筛选条件
            </button>
          )}
        </div>
      )}

      {/* 全选 + 已选操作 */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-background">
        <button
          onClick={toggleSelectAll}
          className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground"
        >
          <div
            className={cn(
              "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all",
              isAllSelected
                ? "bg-[#0052D9] border-[#0052D9]"
                : "border-muted-foreground/30 hover:border-[#0052D9]"
            )}
          >
            {isAllSelected && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="truncate">
            {selectedInvoices.length > 0 ? `已选 ${selectedInvoices.length} 张` : "全选"}
          </span>
        </button>

        {selectedInvoices.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="h-8 rounded-lg border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              删除
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (reimbursementLines.length === 0) return
                setShowReimbursementPreview(true)
              }}
              className="h-8 rounded-lg bg-[#0052D9] px-3 text-xs text-white hover:bg-[#0052D9]/90"
            >
              <Receipt className="mr-1 h-3.5 w-3.5" />
              报销
            </Button>
          </div>
        )}
      </div>

      {/* 发票列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">暂无符合条件的发票</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className={cn(
                "bg-card rounded-xl p-4 border transition-all",
                selectedInvoices.includes(invoice.id)
                  ? "border-[#0052D9]/40 shadow-sm shadow-[#0052D9]/10"
                  : "border-border/50 hover:shadow-sm"
              )}
            >
              <div className="flex items-start gap-3">
                {/* 复选框 */}
                <button
                  onClick={() => toggleInvoiceSelection(invoice.id)}
                  className={cn(
                    "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                    selectedInvoices.includes(invoice.id)
                      ? "bg-[#0052D9] border-[#0052D9]"
                      : "border-muted-foreground/30 hover:border-[#0052D9]"
                  )}
                >
                  {selectedInvoices.includes(invoice.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>

                {/* 发票信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                      {invoice.merchant}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 shrink-0",
                        categoryConfig[invoice.category].color
                      )}
                    >
                      {categoryConfig[invoice.category].label}
                    </Badge>
                  </div>

                  <p className="text-lg font-bold text-foreground mb-2">
                    ¥{invoice.amount.toFixed(2)}元
                  </p>

                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <div className="flex">
                      <span className="w-12 shrink-0">时　间</span>
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex">
                      <span className="w-12 shrink-0">购买方</span>
                      <span className="truncate">{invoice.buyer}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加发票浮动按钮 */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
        <Button 
          onClick={() => setShowAddMenu(true)}
          className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加发票
        </Button>
      </div>

      {/* ActionSheet 遮罩 + 菜单 */}
      {showAddMenu && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/40 z-30 transition-opacity"
            onClick={() => setShowAddMenu(false)}
          />
          
          {/* ActionSheet */}
          <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto max-w-[375px] bg-card rounded-t-3xl overflow-hidden">
              {/* 标题 */}
              <div className="text-center py-4 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">添加发票</h3>
                <p className="text-xs text-muted-foreground mt-1">选择导入方式</p>
              </div>

              {/* 菜单选项 */}
              <div className="p-4 space-y-3">
                {addMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddMenuClick(item.id)}
                    className="w-full flex items-center gap-4 p-4 bg-secondary/60 rounded-2xl hover:bg-secondary transition-colors"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      item.id === "email" ? "bg-[#0052D9]" : "bg-[#0052D9]/10"
                    )}>
                      <item.icon className={cn(
                        "w-6 h-6",
                        item.id === "email" ? "text-white" : "text-[#0052D9]"
                      )} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* 取消按钮 */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="w-full py-3.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  取消
                </button>
              </div>

              {/* 安全区域 */}
              <div className="h-8 bg-card" />
            </div>
          </div>
        </>
      )}

      <ReimbursementPreviewDialog
        open={showReimbursementPreview}
        onClose={() => setShowReimbursementPreview(false)}
        onConfirm={handleReimbursementConfirm}
        lines={reimbursementLines}
      />
    </div>
  )
}
