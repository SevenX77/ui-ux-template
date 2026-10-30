# Terms

Purpose: the owner and every agent mean the same thing by each word, so a discussion of the interface needs no re-explanation.

Status: established by default consent unless the owner objects (2026-10-30). The living, illustrated version is section 01 of `ui-handbook.html`; this file is the plain-text copy for agents.

## Structure

| Term | English | Meaning | Example |
| --- | --- | --- | --- |
| 工作台 | Workspace | The whole interface of one application, on which components sit. | Section 05 of the handbook. |
| 组件 | Component | One functional unit with its own panel and state; it can be opened and hidden. | Chat, timeline, context panel. |
| 控件 | Control | The smallest operable part inside a component. | Send button, segmented switch. |
| 触发核 | Core | The minimal part a component keeps at rest; touching it expands the component. | The chat at rest is one line of grey text. |

## Component states

| Term | English | Meaning | Chat component |
| --- | --- | --- | --- |
| 静息 | Rest | Nothing touches it; it recedes. | Opacity .72, no shadow, no send button. |
| 悬停 | Hover | The pointer stays .15s; a preview only, content does not expand. | Lifts and gains a shadow; no history. |
| 聚焦 | Focus | The user clicks in; response is immediate and the component is fully open. | Width 80%, history and send appear. |
| 变暗 | Dim | Another component is active; opacity .3, still clickable. | Hovering the timeline dims chat and text. |
| 退场 | Retire | Conflict removes it entirely; it cannot be clicked. | Chat focus collapses the timeline to height 0. |

## How components give way

The relation between the two components decides which one applies.

| Term | English | Applies when | Story Forge case |
| --- | --- | --- | --- |
| 挤占 | Push | Both are read together. | Context panel grows from 0 to 360px; reading column yields; the pair re-centres under a 1040px cap. A picked audio lane grows from 30 to 46px and the others shrink to 26px. |
| 覆盖 | Overlay | The view is temporary. | Chat history covers the text; the text gains 240px of scroll room so it can scroll clear. |
| 退场 | Retire | Both claim the same place. | Timeline during chat focus; timeline in Explore mode. |

| Term | English | Meaning |
| --- | --- | --- |
| 聚焦范围 | Focus scope | Every region that still counts as inside a component; only a click outside ends focus. The chat's scope includes input, send and history. |
| 注意力锁 | Attention lock | Only one component can be in hover at a time; the next is admitted 500ms after the previous one leaves. |
| 意图延迟 | Intent delay | The wait before responding to entry, so a passing pointer triggers nothing: .15s for hover, 0 for a deliberate click. |

## Visual

| Term | English | Meaning |
| --- | --- | --- |
| 配色方案 | Scheme | A full set of colour variables, one entry in `src/themes.json`. Six themes in three light/dark pairs: 纯白 Pure / 荧光 Neon, 彩光 Prism / 极光 Aurora, 纸本 Paper / 余烬 Ember. |
| 信号 | Signal | A small solid colour meaning "this is the current one". |
| 体积 | Volume | A large soft-lit card, drawn in CSS; at most one per screen. |
| 图案 | Pattern | Grey dot structure in which only data points carry colour. |
| 底面 / 卡片 / 浮层 | Ground / Card / Float | Page background; a grouped tint with no border or shadow at rest; a surface out of the flow with a shadow. |
| 凹槽 / 凸起 | Recess / Raised | A base cut below its panel, and the selected button standing in it. |
