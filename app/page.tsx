"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatScreen } from "@/components/chat-screen"
import { InvoiceList, type FolderImportFilter } from "@/components/invoice-list"
import { AccountPage } from "@/components/account-page"
import { EmailSettings } from "@/components/email-settings"
import { EmailImportHistory } from "@/components/email-import-history"
import { BottomTabBar, type MainTabId } from "@/components/bottom-tab-bar"
import { ReimbursementList, type SavedReimbursementForm } from "@/components/reimbursement-list"
import { ReimbursementDetail } from "@/components/reimbursement-detail"
import { cn } from "@/lib/utils"

type SubPage = null | "emailSettings" | "importHistory" | "reimbursementDetail"

/** 邮件导入记录页返回：发票夹入口进入应回到主界面发票夹；邮箱设置进入应回到邮箱设置 */
type ImportHistoryReturnTo = "folder" | "emailSettings" | null

const MAIN_TABS: MainTabId[] = ["chat", "folder", "reimbursements", "account"]

function tabFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): MainTabId {
  const raw = searchParams.get("tab")
  if (raw && MAIN_TABS.includes(raw as MainTabId)) {
    return raw as MainTabId
  }
  return "chat"
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <InvoiceAssistant />
    </Suspense>
  )
}

function InvoiceAssistant() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = tabFromSearchParams(searchParams)
  const [subPage, setSubPage] = useState<SubPage>(null)
  const [folderImportFilter, setFolderImportFilter] = useState<FolderImportFilter | null>(null)
  const [importHistoryReturnTo, setImportHistoryReturnTo] = useState<ImportHistoryReturnTo>(null)
  const [reimbursementForms, setReimbursementForms] = useState<SavedReimbursementForm[]>([])
  const [reimbursementDetailId, setReimbursementDetailId] = useState<string | null>(null)
  const unlinkInvoicesRef = useRef<((ids: number[]) => void) | null>(null)
  const linkInvoicesRef = useRef<((ids: number[]) => void) | null>(null)

  const handleRegisterUnlinkInvoices = useCallback((fn: ((ids: number[]) => void) | null) => {
    unlinkInvoicesRef.current = fn
  }, [])

  const handleRegisterLinkInvoices = useCallback((fn: ((ids: number[]) => void) | null) => {
    linkInvoicesRef.current = fn
  }, [])

  const navigateTab = useCallback(
    (tab: MainTabId) => {
      router.replace(`/?tab=${tab}`, { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    if (activeTab !== "folder") {
      setFolderImportFilter(null)
    }
  }, [activeTab])

  const handleViewInFolder = (payload: FolderImportFilter) => {
    setImportHistoryReturnTo(null)
    setSubPage(null)
    navigateTab("folder")
    setFolderImportFilter(payload)
  }

  /** 从发票夹「添加发票 → 邮件导入」进入邮件导入记录页 */
  const handleEmailImport = () => {
    setImportHistoryReturnTo("folder")
    setSubPage("importHistory")
  }

  const handleImportHistoryBack = () => {
    if (importHistoryReturnTo === "folder") {
      setSubPage(null)
    } else {
      setSubPage("emailSettings")
    }
    setImportHistoryReturnTo(null)
  }

  const handleReimbursementCreated = useCallback(
    (form: SavedReimbursementForm) => {
      setReimbursementForms((prev) => [form, ...prev])
      navigateTab("reimbursements")
    },
    [navigateTab]
  )

  const handlePersistChatReimbursement = useCallback((form: SavedReimbursementForm) => {
    setReimbursementForms((prev) => [form, ...prev])
    linkInvoicesRef.current?.(form.invoiceIds ?? [])
  }, [])

  const handleOpenChatReimbursementDetail = useCallback(
    (form: SavedReimbursementForm) => {
      navigateTab("reimbursements")
      setReimbursementDetailId(form.id)
      setSubPage("reimbursementDetail")
    },
    [navigateTab]
  )

  const handleOpenReimbursementDetail = useCallback((form: SavedReimbursementForm) => {
    setReimbursementDetailId(form.id)
    setSubPage("reimbursementDetail")
  }, [])

  const handleCloseReimbursementDetail = useCallback(() => {
    setSubPage(null)
    setReimbursementDetailId(null)
  }, [])

  const handleDeleteReimbursement = useCallback((formId: string, invoiceIds: number[]) => {
    unlinkInvoicesRef.current?.(invoiceIds)
    setReimbursementForms((prev) => prev.filter((f) => f.id !== formId))
    setSubPage(null)
    setReimbursementDetailId(null)
  }, [])

  const reimbursementDetailForm =
    reimbursementDetailId != null
      ? reimbursementForms.find((f) => f.id === reimbursementDetailId)
      : undefined

  // 判断是否展示子页面（隐藏 TabBar）
  const showSubPage = subPage !== null

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端预览框 */}
      <div className="mx-auto max-w-[375px] min-h-screen lg:min-h-0 lg:h-[812px] lg:my-8 lg:rounded-[2.5rem] lg:shadow-2xl lg:border lg:border-border overflow-hidden bg-background relative flex flex-col">
        
        {/* 状态栏模拟 */}
        <div className="h-11 bg-card flex items-center justify-between px-8 text-xs font-medium text-foreground">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              <div className="w-[3px] h-2 bg-foreground rounded-full" />
              <div className="w-[3px] h-3 bg-foreground rounded-full" />
              <div className="w-[3px] h-4 bg-foreground rounded-full" />
              <div className="w-[3px] h-3 bg-foreground/40 rounded-full" />
            </div>
            <svg className="w-6 h-3 ml-1" viewBox="0 0 25 12">
              <rect x="0" y="0" width="22" height="12" rx="3" stroke="currentColor" strokeWidth="1" fill="none" />
              <rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" />
              <rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* 滚动内容区域：主界面在「对话」Tab 时由 ChatScreen 内部滚动，避免输入框被卷走 */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            showSubPage ? "overflow-y-auto" : "overflow-hidden"
          )}
        >
          {/* 子页面渲染 */}
          {subPage === "emailSettings" && (
            <EmailSettings
              onBack={() => setSubPage(null)}
              onViewHistory={() => {
                setImportHistoryReturnTo("emailSettings")
                setSubPage("importHistory")
              }}
            />
          )}

          {subPage === "importHistory" && (
            <EmailImportHistory
              onBack={handleImportHistoryBack}
              onViewInFolder={handleViewInFolder}
              onOpenEmailSettings={() => setSubPage("emailSettings")}
            />
          )}

          {subPage === "reimbursementDetail" &&
            (reimbursementDetailForm ? (
              <ReimbursementDetail
                form={reimbursementDetailForm}
                onBack={handleCloseReimbursementDetail}
                onDelete={handleDeleteReimbursement}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-6">
                <p className="text-sm text-muted-foreground">报销单不存在或已删除</p>
                <button
                  type="button"
                  className="rounded-xl bg-[#0052D9] px-4 py-2 text-sm text-white"
                  onClick={handleCloseReimbursementDetail}
                >
                  返回
                </button>
              </div>
            ))}

          {/* 主页面渲染 */}
          {!showSubPage && (
            <>
              {/* 页面标题 */}
              <header className="shrink-0 px-5 py-4 bg-card border-b border-border sticky top-0 z-10">
                <h1 className="text-lg font-semibold text-foreground">
                  {activeTab === "chat" && "发票助手"}
                  {activeTab === "folder" && "发票夹"}
                  {activeTab === "reimbursements" && "报销单"}
                  {activeTab === "account" && "账户设置"}
                </h1>
              </header>

              {/* 内容区域 */}
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col",
                  activeTab === "chat" ? "overflow-hidden" : "overflow-y-auto"
                )}
              >
                <div
                  className={cn(
                    activeTab === "chat"
                      ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                      : "hidden"
                  )}
                >
                  <ChatScreen
                    onOpenEmailSettings={() => setSubPage("emailSettings")}
                    onPersistChatReimbursement={handlePersistChatReimbursement}
                    onOpenChatReimbursementDetail={handleOpenChatReimbursementDetail}
                  />
                </div>
                <div
                  className={cn(
                    activeTab === "folder"
                      ? "min-h-0 flex-1 space-y-6 overflow-y-auto py-4 pb-24"
                      : "hidden"
                  )}
                >
                  <InvoiceList
                    onEmailImport={handleEmailImport}
                    folderImportFilter={folderImportFilter}
                    onClearFolderImportFilter={() => setFolderImportFilter(null)}
                    onReimbursementCreated={handleReimbursementCreated}
                    onRegisterUnlinkInvoices={handleRegisterUnlinkInvoices}
                    onRegisterLinkInvoices={handleRegisterLinkInvoices}
                  />
                </div>
                <div
                  className={cn(
                    activeTab === "reimbursements"
                      ? "min-h-0 flex-1 space-y-6 overflow-y-auto py-4 pb-24"
                      : "hidden"
                  )}
                >
                  <ReimbursementList items={reimbursementForms} onOpenDetail={handleOpenReimbursementDetail} />
                </div>
                <div
                  className={cn(
                    activeTab === "account"
                      ? "min-h-0 flex-1 space-y-6 overflow-y-auto py-4 pb-24"
                      : "hidden"
                  )}
                >
                  <AccountPage onEmailSettings={() => setSubPage("emailSettings")} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部导航栏 - 子页面隐藏 */}
        {!showSubPage && (
          <BottomTabBar activeTab={activeTab} onTabChange={navigateTab} />
        )}
      </div>
    </div>
  )
}
