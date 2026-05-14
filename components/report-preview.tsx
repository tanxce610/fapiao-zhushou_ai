"use client"

import { FileSpreadsheet, X, Plane, Utensils, Package, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ReportPreviewProps {
  open: boolean
  onClose: () => void
}

const reportData = {
  totalAmount: 3414.50,
  invoiceCount: 7,
  dateRange: "2024年5月1日 - 5月12日",
  categories: [
    { name: "差旅", icon: Plane, amount: 1948.00, count: 2, color: "bg-blue-500" },
    { name: "餐饮", icon: Utensils, amount: 411.50, count: 3, color: "bg-orange-500" },
    { name: "办公用品", icon: Package, amount: 1055.00, count: 2, color: "bg-purple-500" },
  ]
}

export function ReportPreview({ open, onClose }: ReportPreviewProps) {
  if (!open) return null

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-card rounded-t-3xl overflow-hidden">
          {/* 拖动指示器 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* 头部 */}
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052D9] to-[#3B82F6] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">报销报告</h3>
                <p className="text-xs text-muted-foreground">{reportData.dateRange}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* 金额汇总 */}
          <div className="mx-5 bg-gradient-to-br from-[#0052D9] to-[#3B82F6] rounded-2xl p-5 text-white">
            <p className="text-sm text-white/70 mb-1">报销总金额</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm">¥</span>
              <span className="text-4xl font-bold tracking-tight">
                {reportData.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">
              共 {reportData.invoiceCount} 张发票
            </p>
          </div>

          {/* 分类明细 */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">分类明细</p>
            {reportData.categories.map((category) => {
              const Icon = category.icon
              const percentage = (category.amount / reportData.totalAmount) * 100
              return (
                <div key={category.name} className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", category.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                      <span className="text-sm font-semibold text-[#0052D9]">
                        ¥{category.amount.toFixed(2)}
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", category.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {category.count}张
                  </span>
                </div>
              )
            })}
          </div>

          {/* 导出按钮 */}
          <div className="px-5 pb-8 pt-2">
            <Button
              className={cn(
                "w-full h-12 rounded-xl text-white font-medium text-sm",
                "bg-gradient-to-r from-[#0052D9] to-[#3B82F6] hover:opacity-90"
              )}
            >
              <Download className="w-4 h-4 mr-2" />
              导出到 Excel
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
