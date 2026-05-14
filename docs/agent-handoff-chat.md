# 对话页（Chat）功能交接说明

> 供在新 Agent 窗口中快速恢复上下文。路径：`发票助手/docs/agent-handoff-chat.md`  
> 涉及文件以 `发票助手/` 为仓库根目录。

---

## 1. 产品目标概览

### 1.1 Mock 意图识别（文字）

- 用户发消息后 **约 500ms** 再出现 AI 回复（`delay(500)`）。
- **关键词「传 / 上传 / 发票 / 识别」**：AI 固定话术，并在该条 AI 消息下展示 **「上传发票文件」「邮件导入」** 两个按钮。
- **关键词「报销 / 生成」**（含快捷语「帮我报销」）：AI 提示勾选最近 7 天发票 → **底部弹窗多选/全选** → 取消关弹窗；确定后走报销生成流程（见下文）。
- **其他内容**：AI 兜底话术（含「我要传发票」「生成报销单」引导）。

### 1.2 上传文件 / 邮件导入（分支）

- **上传文件**：用户选文件后 AI「已收到…正在识别」+ loading → **500ms** 后成功话术（Mock N 张）+ 是否生成报销单。
- **邮件导入**：AI 提示收票邮箱 `work@company.com`，问是否修改；**「修改」** → `onOpenEmailSettings`；**「不修改」** → 同步 loading → **500ms** 后成功话术。**注意**：`isNoModifyIntent` 必须在 `isModifyIntent` 之前判断，且「不修改」不能误判为「修改」（`isModifyIntent` 需排除含「不修改」的句子）。

### 1.3 报销：弹窗 → 对话内卡片 → 详情

- 用户勾选发票并 **确定** 后：用户气泡 → AI「正在生成报销单，请稍等。」loading → **500ms** 后去掉 loading。
- **不再**使用 `ReimbursementPreviewDialog` 完成该链路。
- 根据所选发票构建 `SavedReimbursementForm`，调用 **`onPersistChatReimbursement`**：写入全局列表 + **关联发票**（`linkInvoicesRef`），**不自动打开详情**。
- 再追加一条 AI 消息，带 **`reimbursementCard`**：在对话里渲染与 **报销单列表** 风格一致的 **可点击卡片**；点击调用 **`onOpenChatReimbursementDetail`**：切 Tab 到报销单并打开 **报销单详情子页**。

### 1.4 输入区 UI（豆包式 / 小程序向）

- 输入区在 **对话 Tab 内** 相对手机框 **固定在底部**，`padding-bottom` 与底部 **`BottomTabBar`（h-20）** 及 **`safe-area-inset-bottom`** 对齐，避免被 Tab 遮挡。
- **主区布局**：`app/page.tsx` 在「对话」Tab 使用 **`overflow-hidden` + 内部滚动**，由 `ChatScreen` 内消息列表滚动，避免整块输入区被卷走。
- **快捷 chip**：「识别发票」「帮我报销」→ 直接 `processUserText(...)` 走意图。
- **胶囊输入条**：相机、占位「发消息」、语音占位、**+** 切换展开区；展开为 **相机 / 相册 / 文件 / 生成报告**（H5 用多个 `input[type=file]`；注释说明小程序可换 `wx.chooseMedia` 等）。
- 发送：**Enter** 发送（已移除独立发送按钮）。

---

## 2. 关键文件与职责

| 文件 | 职责摘要 |
|------|-----------|
| `components/chat-screen.tsx` | 消息流、意图分支、发票多选弹窗、上传/邮件分支、**对话内报销单卡片**、底部输入 UI、`replaceLatestLoadingMessage` / `removeLatestLoadingMessage` |
| `app/page.tsx` | `linkInvoicesRef` + `onRegisterLinkInvoices`；**四 Tab 内容用 `hidden` 保持挂载**（保证从对话关联发票时 `InvoiceList` 仍在）；`handlePersistChatReimbursement` / `handleOpenChatReimbursementDetail` 传给 Chat |
| `components/invoice-list.tsx` | `INITIAL_INVOICES`、`onRegisterLinkInvoices` / `onRegisterUnlinkInvoices`、报销创建逻辑（发票夹仍可能用预览弹窗，与对话链路分离） |
| `components/reimbursement-list.tsx` | 报销单列表卡片样式（对话内卡片对齐此样式） |
| `components/reimbursement-preview-dialog.tsx` | 发票夹等流程仍可用；**对话勾选报销已不再依赖此弹窗** |
| `components/bottom-tab-bar.tsx` | `h-20`、`absolute bottom`，与 Chat 底部 `pb-[calc(5rem+env(safe-area-inset-bottom))]` 对齐 |

---

## 3. ChatScreen Props（当前约定）

```ts
interface ChatScreenProps {
  onGenerateReport: () => void
  onOpenEmailSettings: () => void
  /** 对话内生成报销单后：写入列表 + 关联发票，不跳转 */
  onPersistChatReimbursement: (form: SavedReimbursementForm) => void
  /** 用户点击对话中的报销单卡片：切 Tab + 打开详情子页 */
  onOpenChatReimbursementDetail: (form: SavedReimbursementForm) => void
}
```

**已废弃的 prop 名称**：`onChatReimbursementComplete`（若在新代码中见到请改为上述两个回调）。

---

## 4. 消息模型扩展（`chat-screen.tsx`）

`Message` 除 `type / content / time` 外可能包含：

- `showImportChoices`：发票意图下的两个操作按钮。
- `loading`：AI 气泡内转圈。
- `reimbursementCard?: SavedReimbursementForm`：**仅 AI**，用于渲染列表风格卡片。

辅助函数示例：

- `buildReimbursementFormFromPicker(invoices, selectedIds)`：Mock 生成报销单（名称如 `日常报销 YYYY-MM-DD`）。
- `formatReimbursementCardDate(ymd)`：与列表页创建时间展示一致。

---

## 5. 布局要点（避免信息丢失）

1. **Tab 与 Chat 高度链**：主内容容器对「对话」为 `flex-1 min-h-0 overflow-hidden`，Chat 根节点 `flex min-h-0 flex-1 flex-col`，消息区 `flex-1 min-h-0 overflow-y-auto`，底部输入 `shrink-0` + 上述 `pb`。
2. **InvoiceList 常驻挂载**：非对话 Tab 用 `hidden` 隐藏而非卸载，否则 `linkInvoicesRef.current` 在对话生成报销时可能为 `null`。

---

## 6. 后续可迭代方向（未做或可选）

- 对话内报销单名称/规则改为用户可编辑或二次确认。
- 发票选择弹层 `z-index` 与底部 Tab 的视觉层级微调。
- 小程序端将 `input[type=file]` 替换为 `wx.chooseMedia` / `wx.chooseMessageFile` 等真实 API。
- 语音按钮接入按住说话。

---

## 7. 验证建议

1. 对话输入「识别发票」或点快捷语 → 出现上传/邮件分支；上传文件 → loading → 成功话术。  
2. 「帮我报销」→ 弹窗多选 → 确定 → 对话内出现报销单卡片 → 点击进详情；发票夹对应发票应为已关联。  
3. 切换 Tab 后从对话再生成一张报销单，确认关联仍正常（列表已挂载）。  
4. 底部输入不被 Tab 遮挡，安全区设备上底部留白正常。

---

*文档由先前对话与代码修改整理而成；若实现与本文不一致，以仓库当前代码为准。*
