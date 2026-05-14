"use client"

import { useCallback, useEffect, useRef, useState, type ChangeEventHandler } from "react"
import {
  Camera,
  Mail,
  Sparkles,
  Loader2,
  Check,
  X,
  Plus,
  Paperclip,
  Image as ImageIcon,
  Mic,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { INITIAL_INVOICES, type Invoice } from "@/components/invoice-list"
import type { SavedReimbursementForm } from "@/components/reimbursement-list"
import { cn } from "@/lib/utils"

const RECEIVING_EMAIL = "work@company.com"

/** 预设知识库：匹配顺序需在「发票/报销」意图之前，避免误触 */
const KB_Q_INVOICE_HOW = "怎么开发票？"
const KB_A_INVOICE_HOW =
  "实际电子专票/普票 需要公司名+税号即可，纸质专票可能需要全部开票资料。"

const KB_Q_REIMBURSE_FLOW = "报销流程是怎样的？"
const KB_A_REIMBURSE_FLOW =
  "消费后需要自行开发票，然后按模板整理成报销单excel表格，登录企微，进入工作台-》审批-》报销提交报销申请，附件需要上传发票和表格文件。"

function matchKbInvoiceHow(text: string): boolean {
  const t = text.trim()
  return (
    t.includes("怎么开发票") ||
    t.includes("如何开发票") ||
    t === KB_Q_INVOICE_HOW
  )
}

function matchKbReimburseFlow(text: string): boolean {
  const t = text.trim()
  return t.includes("报销流程") || t === KB_Q_REIMBURSE_FLOW
}

const categoryStyle: Record<Invoice["category"], string> = {
  travel: "bg-blue-50 text-blue-600 border-blue-200",
  food: "bg-orange-50 text-orange-600 border-orange-200",
  office: "bg-purple-50 text-purple-600 border-purple-200",
}
const categoryLabel: Record<Invoice["category"], string> = {
  travel: "差旅费",
  food: "餐饮费",
  office: "材料费",
}

function nowClock(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function delay(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms))
}

function replaceLatestLoadingMessage(
  prev: Message[],
  patch: Partial<Pick<Message, "content" | "loading">>
): Message[] {
  const next = [...prev]
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].loading) {
      next[i] = { ...next[i], ...patch }
      break
    }
  }
  return next
}

function removeLatestLoadingMessage(prev: Message[]): Message[] {
  const next = [...prev]
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].loading) {
      next.splice(i, 1)
      break
    }
  }
  return next
}

function matchInvoiceIntent(text: string): boolean {
  return ["传", "上传", "发票", "识别"].some((k) => text.includes(k))
}

function matchReimburseIntent(text: string): boolean {
  return text.includes("报销") || text.includes("生成")
}

function isModifyIntent(text: string): boolean {
  const t = text.trim()
  if (t.includes("不修改")) return false
  return t === "修改" || t.includes("修改")
}

function isNoModifyIntent(text: string): boolean {
  const t = text.trim()
  return t === "不修改" || t.includes("不修改")
}

function recentInvoicesForPicker(all: Invoice[]): Invoice[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const filtered = all.filter((inv) => inv.importDate >= cutoffStr)
  return filtered.length > 0 ? filtered : all.filter((inv) => inv.status === "unlinked").slice(0, 5)
}

function formatInvoiceListDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`
}

function formatReimbursementCardDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return ymd
  return `${y}年${String(m).padStart(2, "0")}月${String(d).padStart(2, "0")}日`
}

function buildReimbursementFormFromPicker(
  invoices: Invoice[],
  selectedIds: number[]
): SavedReimbursementForm {
  const selected = invoices.filter((inv) => selectedIds.includes(inv.id))
  const createdAt = new Date().toISOString().slice(0, 10)
  const total = selected.reduce((sum, inv) => sum + inv.amount, 0)
  return {
    id: `rb-${Date.now()}`,
    name: `日常报销 ${createdAt}`,
    createdAt,
    total,
    count: selected.length,
    invoiceIds: selected.map((inv) => inv.id),
    lines: selected.map((inv) => ({
      id: inv.id,
      projectName: inv.merchant,
      invoiceDate: inv.invoiceDate,
      amount: inv.amount,
    })),
  }
}

interface ChatScreenProps {
  onOpenEmailSettings: () => void
  /** 对话内生成报销单后写入列表并关联发票，不跳转 */
  onPersistChatReimbursement: (form: SavedReimbursementForm) => void
  /** 用户点击对话中的报销单卡片 */
  onOpenChatReimbursementDetail: (form: SavedReimbursementForm) => void
}

type Message = {
  id: number
  type: "ai" | "user"
  content: string
  time: string
  /** AI 气泡下展示「上传文件 / 邮件导入」 */
  showImportChoices?: boolean
  /** AI 报销引导：展示「查看详情」，点击后再打开勾选弹窗 */
  showReimbursementPickerEntry?: boolean
  /** AI 气泡内展示转圈（识别中） */
  loading?: boolean
  /** 对话内生成的报销单卡片（与报销单列表样式一致） */
  reimbursementCard?: SavedReimbursementForm
}

export function ChatScreen({
  onOpenEmailSettings,
  onPersistChatReimbursement,
  onOpenChatReimbursementDetail,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 1,
      type: "ai",
      content:
        "您好！我是您的发票助手，我可以帮您：\n\n• 识别并保存发票\n• 生成报销单\n• 解答报销遇到的问题\n\n你可以给我发送发票或向我提问~",
      /** 避免 SSR 与客户端时间不一致导致水合失败、点击全部失效 */
      time: "--:--",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const nextIdRef = useRef(2)
  const scrollRef = useRef<HTMLDivElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const albumInputRef = useRef<HTMLInputElement>(null)

  const [awaitingEmailModify, setAwaitingEmailModify] = useState(false)
  const [showInvoicePicker, setShowInvoicePicker] = useState(false)
  /** 首屏与 SSR 使用静态列表，挂载后再按「最近 7 天」收窄，避免 Date 导致水合不一致 */
  const [pickerInvoices, setPickerInvoices] = useState<Invoice[]>(INITIAL_INVOICES)
  const [pickerSelected, setPickerSelected] = useState<number[]>([])

  const appendMessage = useCallback((msg: Omit<Message, "id">) => {
    const id = nextIdRef.current++
    setMessages((prev) => [...prev, { ...msg, id }])
  }, [])

  const appendAiAfterDelay = useCallback(
    async (ms: number, msg: Omit<Message, "id">) => {
      await delay(ms)
      appendMessage({ ...msg, type: "ai", time: nowClock() })
    },
    [appendMessage]
  )

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  useEffect(() => {
    setPickerInvoices(recentInvoicesForPicker(INITIAL_INVOICES))
    setMessages((prev) =>
      prev.map((m) => (m.id === 1 && m.time === "--:--" ? { ...m, time: nowClock() } : m))
    )
  }, [])

  const processUserText = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text) return

      appendMessage({ type: "user", content: text, time: nowClock() })
      await delay(500)

      if (awaitingEmailModify) {
        setAwaitingEmailModify(false)
        if (isNoModifyIntent(text)) {
          appendMessage({
            type: "ai",
            content: "正在同步邮件中，请稍等",
            time: nowClock(),
            loading: true,
          })
          const syncN = 2
          await delay(500)
          setMessages((prev) =>
            replaceLatestLoadingMessage(prev, {
              loading: false,
              content: `同步成功！成功导入${syncN}张发票！\n\n是否需要我马上为你生成报销单？`,
            })
          )
          return
        }
        if (isModifyIntent(text)) {
          onOpenEmailSettings()
          await appendAiAfterDelay(0, {
            content: "已为您打开邮箱设置，修改完成后可返回对话继续操作。",
          })
          return
        }
        await appendAiAfterDelay(0, {
          content: "请回复「修改」或「不修改」以继续。",
        })
        setAwaitingEmailModify(true)
        return
      }

      if (matchKbInvoiceHow(text)) {
        await appendAiAfterDelay(0, { content: KB_A_INVOICE_HOW })
        return
      }
      if (matchKbReimburseFlow(text)) {
        await appendAiAfterDelay(0, { content: KB_A_REIMBURSE_FLOW })
        return
      }

      if (matchReimburseIntent(text)) {
        const n = pickerInvoices.length
        await appendAiAfterDelay(0, {
          content: `查询到你最近7天导入了${n}张发票，请点击查看详情选择你要报销的发票`,
          showReimbursementPickerEntry: true,
        })
        return
      }

      if (matchInvoiceIntent(text)) {
        appendMessage({
          type: "ai",
          content:
            "你可以直接在输入框中直接给我发送发票，或者选择其他方式。",
          time: nowClock(),
          showImportChoices: true,
        })
        return
      }

      await appendAiAfterDelay(0, {
        content:
          "我是你的发票助手，你可以对我说「我要传发票」或「生成报销单」，也可问我「怎么开发票」「报销流程是怎样的」。",
      })
    },
    [appendAiAfterDelay, appendMessage, awaitingEmailModify, onOpenEmailSettings, pickerInvoices]
  )

  const handleSend = () => {
    const v = inputValue.trim()
    if (!v) return
    setInputValue("")
    void processUserText(v)
  }

  const handlePickFile = () => documentInputRef.current?.click()

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    appendMessage({
      type: "user",
      content: `已发送文件：${file.name}`,
      time: nowClock(),
    })
    await delay(500)
    appendMessage({
      type: "ai",
      content: "已收到发票文件，正在识别中，请稍等。",
      time: nowClock(),
      loading: true,
    })
    const n = 3
    await delay(500)
    setMessages((prev) =>
      replaceLatestLoadingMessage(prev, {
        loading: false,
        content: `识别成功！成功识别到${n}张发票！\n\n是否需要我马上为你生成报销单？`,
      })
    )
  }

  const handleEmailImportChoice = async () => {
    appendMessage({ type: "user", content: "邮件导入", time: nowClock() })
    await delay(500)
    appendMessage({
      type: "ai",
      content: `检测到您当前的收票邮箱是【${RECEIVING_EMAIL}】，是否需要修改？`,
      time: nowClock(),
    })
    setAwaitingEmailModify(true)
  }

  const pickerAllSelected =
    pickerInvoices.length > 0 && pickerSelected.length === pickerInvoices.length

  const togglePickerSelectAll = () => {
    if (pickerAllSelected) setPickerSelected([])
    else setPickerSelected(pickerInvoices.map((i) => i.id))
  }

  const togglePickerOne = (id: number) => {
    setPickerSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {/* H5 预览用 file input；小程序可替换为 wx.chooseMedia / wx.chooseMessageFile */}
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      <input
        ref={albumInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <input
        ref={documentInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.ofd,.webp,image/*"
        onChange={handleFileChange}
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-2">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={cn(
                "flex gap-3",
                message.type === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  message.type === "ai"
                    ? "bg-gradient-to-br from-[#0052D9] to-[#3B82F6]"
                    : "bg-gradient-to-br from-gray-200 to-gray-300"
                )}
              >
                {message.type === "ai" ? (
                  <Sparkles className="h-5 w-5 text-white" />
                ) : (
                  <span className="text-sm font-medium text-gray-600">我</span>
                )}
              </div>

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.type === "ai"
                    ? "rounded-tl-md bg-secondary text-foreground"
                    : "rounded-tr-md bg-[#0052D9] text-white"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.loading && message.type === "ai" && (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#0052D9]" />
                  )}
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
                <span
                  className={cn(
                    "mt-2 block text-[10px]",
                    message.type === "ai" ? "text-muted-foreground" : "text-white/60"
                  )}
                >
                  {message.time}
                </span>
              </div>
            </div>

            {message.type === "ai" && message.reimbursementCard && (
              <div className="ml-12 mt-1 max-w-[min(100%,17.5rem)]">
                <button
                  type="button"
                  onClick={() => onOpenChatReimbursementDetail(message.reimbursementCard!)}
                  className="relative w-full rounded-xl border border-border/50 bg-card p-4 text-left shadow-sm transition-colors hover:border-[#0052D9]/30 hover:bg-secondary/20 active:scale-[0.99]"
                >
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <div className="pr-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {message.reimbursementCard.name}
                      </h3>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      创建时间：{formatReimbursementCardDate(message.reimbursementCard.createdAt)}
                    </p>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="mb-0.5 text-[10px] text-muted-foreground">金额合计</p>
                        <p className="text-lg font-bold tabular-nums text-foreground">
                          ¥{message.reimbursementCard.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="mb-0.5 text-[10px] text-muted-foreground">发票张数</p>
                        <p className="text-base font-semibold tabular-nums text-foreground">
                          {message.reimbursementCard.count} 张
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {message.type === "ai" && message.showReimbursementPickerEntry && (
              <div className="ml-12 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-[#0052D9] text-white hover:bg-[#0052D9]/90"
                  onClick={() => {
                    setPickerSelected(pickerInvoices.map((i) => i.id))
                    setShowInvoicePicker(true)
                  }}
                >
                  查看详情
                </Button>
              </div>
            )}

            {message.type === "ai" && message.showImportChoices && (
              <div className="ml-12 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#0052D9]/40 text-[#0052D9]"
                  onClick={handlePickFile}
                >
                  上传发票文件
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-[#0052D9] text-white hover:bg-[#0052D9]/90"
                  onClick={() => void handleEmailImportChoice()}
                >
                  邮件导入
                </Button>
              </div>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {showInvoicePicker && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            onClick={() => setShowInvoicePicker(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[78vh] max-w-[375px] flex-col rounded-t-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">选择报销发票</h3>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                onClick={() => setShowInvoicePicker(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <button
                type="button"
                className="flex items-center gap-2 text-xs text-muted-foreground"
                onClick={togglePickerSelectAll}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border-2",
                    pickerAllSelected
                      ? "border-[#0052D9] bg-[#0052D9]"
                      : "border-muted-foreground/30"
                  )}
                >
                  {pickerAllSelected && <Check className="h-3 w-3 text-white" />}
                </span>
                全选
              </button>
              <span className="text-[11px] text-muted-foreground">最近 7 天导入</span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
              {pickerInvoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => togglePickerOne(inv.id)}
                  className={cn(
                    "flex w-full gap-3 rounded-xl border p-3 text-left transition-colors",
                    pickerSelected.includes(inv.id)
                      ? "border-[#0052D9]/50 bg-[#0052D9]/5"
                      : "border-border/50 bg-card"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                      pickerSelected.includes(inv.id)
                        ? "border-[#0052D9] bg-[#0052D9]"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {pickerSelected.includes(inv.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {inv.merchant}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 px-2 py-0 text-[10px] font-medium",
                          categoryStyle[inv.category]
                        )}
                      >
                        {categoryLabel[inv.category]}
                      </Badge>
                    </div>
                    <p className="text-base font-bold text-foreground">
                      ¥{inv.amount.toFixed(2)}元
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      开票 {formatInvoiceListDate(inv.invoiceDate)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 border-t border-border p-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                onClick={() => setShowInvoicePicker(false)}
              >
                取消
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[#0052D9] text-white hover:bg-[#0052D9]/90"
                disabled={pickerSelected.length === 0}
                onClick={async () => {
                  if (pickerSelected.length === 0) return
                  setShowInvoicePicker(false)
                  appendMessage({
                    type: "user",
                    content: `已选择 ${pickerSelected.length} 张发票`,
                    time: nowClock(),
                  })
                  await delay(500)
                  appendMessage({
                    type: "ai",
                    content: "正在生成报销单，请稍等。",
                    time: nowClock(),
                    loading: true,
                  })
                  await delay(500)
                  setMessages((prev) => removeLatestLoadingMessage(prev))
                  const form = buildReimbursementFormFromPicker(pickerInvoices, pickerSelected)
                  onPersistChatReimbursement(form)
                  appendMessage({
                    type: "ai",
                    content: "已为您生成报销单，点击下方卡片可查看详情。",
                    time: nowClock(),
                    reimbursementCard: form,
                  })
                }}
              >
                确定
              </Button>
            </div>
          </div>
        </>
      )}

      {/* 底部输入区：pb 与主导航 h-20 对齐，避免被 Tab 遮挡；安全区适配刘海屏底部 */}
      <div
        className={cn(
          "shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md",
          "shadow-[0_-8px_30px_rgba(0,0,0,0.04)]",
          "pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-2"
        )}
      >
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          <button
            type="button"
            onClick={() => void processUserText("识别发票")}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm active:scale-[0.98]"
          >
            识别发票
          </button>
          <button
            type="button"
            onClick={() => void processUserText("帮我报销")}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm active:scale-[0.98]"
          >
            帮我报销
          </button>
          <button
            type="button"
            onClick={() => void processUserText(KB_Q_INVOICE_HOW)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm active:scale-[0.98]"
          >
            {KB_Q_INVOICE_HOW}
          </button>
          <button
            type="button"
            onClick={() => void processUserText(KB_Q_REIMBURSE_FLOW)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm active:scale-[0.98]"
          >
            {KB_Q_REIMBURSE_FLOW}
          </button>
        </div>

        {showAttachMenu && (
          <div className="border-t border-border/50 bg-muted/40 px-2 py-3">
            <div className="flex justify-around gap-2">
              {(
                [
                  {
                    label: "相机",
                    icon: Camera,
                    onClick: () => {
                      setShowAttachMenu(false)
                      cameraInputRef.current?.click()
                    },
                  },
                  {
                    label: "相册",
                    icon: ImageIcon,
                    onClick: () => {
                      setShowAttachMenu(false)
                      albumInputRef.current?.click()
                    },
                  },
                  {
                    label: "文件",
                    icon: Paperclip,
                    onClick: () => {
                      setShowAttachMenu(false)
                      documentInputRef.current?.click()
                    },
                  },
                  {
                    label: "邮件",
                    icon: Mail,
                    onClick: () => {
                      setShowAttachMenu(false)
                      void handleEmailImportChoice()
                    },
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="flex w-[4.25rem] flex-col items-center gap-1.5 rounded-xl bg-card py-2.5 shadow-sm ring-1 ring-border/60 transition active:scale-[0.97]"
                  >
                    <Icon className="h-6 w-6 text-foreground" strokeWidth={1.75} />
                    <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="px-3 pb-1">
          <div className="flex items-center gap-1 rounded-full border border-border/80 bg-card py-1 pl-1.5 pr-1 shadow-sm">
            <button
              type="button"
              aria-label="拍照"
              onClick={() => {
                setShowAttachMenu(false)
                cameraInputRef.current?.click()
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted/80"
            >
              <Camera className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <Input
              placeholder="发消息"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend()
              }}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              aria-label="语音（小程序中可接按住说话）"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <Mic className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={showAttachMenu ? "关闭更多" : "更多"}
              onClick={() => setShowAttachMenu((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/25 text-foreground hover:bg-muted/60"
            >
              {showAttachMenu ? (
                <X className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Plus className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
