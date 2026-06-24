---
name: 观演红黑榜
description: A brutalist performance-review archive — bold color blocks, heavy typography, zero ornament.
colors:
  ink: "#000000"
  surface: "#ffffff"
  border-subtle: "rgba(0,0,0,0.10)"
  border-strong: "rgba(0,0,0,0.20)"
  accent-red: "#c0392b"
  accent-gold: "#facc15"
  col-grass: "oklch(0.78 0.22 142)"
  col-sky: "oklch(0.72 0.18 235)"
  col-sun: "oklch(0.88 0.19 105)"
  col-clay: "oklch(0.68 0.06 30)"
  dark-bg: "#111111"
  dark-ink: "#eeeeee"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: "clamp(1.25rem, 4vw, 2.5rem)"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  body:
    fontFamily: "system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "0.15em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    padding: "10px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "rgba(0,0,0,0.80)"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    padding: "10px 20px"
    typography: "{typography.label}"
  input-underline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    padding: "8px 0"
    typography: "{typography.body}"
---

# Design System: 观演红黑榜

## 1. Overview

**Creative North Star: "The Underground Archive"**

「观演红黑榜」的视觉系统是一座地下档案室——每一场演出都是一份档案，每一种颜色都是一枚标签。它拒绝 SaaS 模板的圆角与渐变，拒绝 Material Design 的标准化组件，拒绝日系茶系的暖纸色。它是一面钉满海报的水泥墙：高饱和色块、粗体无衬线字、纯黑纯白直角边框。

这个系统只有一个目的：让每一次观演记录都有视觉分量。设计语言本身就是态度的表达——排版即态度，色块即身份，交互有重量，反精致不妥协。

**Key Characteristics:**
- 纯白表面 + 纯黑墨水 + 2px直角边框 — 零圆角、零阴影、零渐变
- 四列高饱和 OKLCH 色块用于记录分类 — 翠绿、宝蓝、亮黄、陶土
- 单一家族多字重（font-black 900 + font-bold 700）— 极端对比即层级
- 全大写标签 + 0.15em tracking — 克制统一的标签语言
- 底划线输入 + 透明背景 — 干净、原始、不退让
- 暗色模式完整覆盖 — 黑白翻转，色块保留

## 2. Colors

纯黑白为骨架，四色为血肉，红金为点缀。

### Primary
- **Ink** (#000000): 所有正文、标题、图标。不放灰，不妥协。
- **Surface** (#ffffff): 全局背景、卡片、抽屉面板。

### Accent
- **Red** (#c0392b): 红榜标识、红榜卡片背景。唯一有"温度"的颜色。
- **Gold** (#facc15): 评分星星。仅此一处使用金色。

### Categorical (Record Columns)
- **Grass** (oklch(0.78 0.22 142)): 记录列配色，高饱和翠绿。
- **Sky** (oklch(0.72 0.18 235)): 记录列配色，饱和宝蓝。
- **Sun** (oklch(0.88 0.19 105)): 记录列配色，亮黄。
- **Clay** (oklch(0.68 0.06 30)): 记录列配色，克制暖陶土。

### Neutral
- **Border Subtle** (rgba(0,0,0,0.10)): 默认 2px 边框、分隔线。
- **Border Strong** (rgba(0,0,0,0.20)): 悬停/聚焦态边框、输入框底线。
- **Dark BG** (#111111): 暗色模式全局背景。
- **Dark Ink** (#eeeeee): 暗色模式全局文字。

### Named Rules
**The Black-and-White Rule.** 页面骨架只用纯黑与纯白。没有奶油白、暖纸色、冷灰——只有 #000 和 #fff。灰度通过 opacity 实现（text-black/80, text-black/40, border-black/10）。

**The Four-Color Rule.** 四列分类色是 ONLY 的彩色元素（除红榜和星星外）。禁止在任何其他 UI 元素上使用这四个 OKLCH 颜色。

## 3. Typography

**Font:** System sans — `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif`

**Character:** 不加载 web font。系统字体零延迟、原生质感、在所有平台上看起来"对"——这是 "Native Plus" 哲学的核心。

### Hierarchy
- **Display** (900, clamp(1.25rem, 4vw, 2.5rem), line-height 1.08): 页面标题、记录列名。text-wrap: balance。
- **Body** (700, 1rem, line-height 1.5): 表单输入、正文。最小 16px。
- **Label** (900, 0.75rem, line-height 1.25, letter-spacing 0.15em): 所有标签、按钮、导航文字。全大写（中文除外）。

### Named Rules
**The Extreme Contrast Rule.** 只用两个字重：font-black (900) 和 font-bold (700)。没有 medium、regular、light。层级由字重和字号的极端差距建立，不由渐进灰度。

**The 0.15em Rule.** 所有标签和按钮使用统一 letter-spacing: 0.15em。整个应用只有一个 tracking 值用于标签。

## 4. Elevation

**Flat by default.** 这个系统不使用阴影来传达深度。所有表面在同一平面。层次由颜色（黑白反转）和边框（2px 描边）区分，不由投影。

暗色模式同理：深度来自表面亮度翻转（白→黑），不由阴影。

**阴影仅用于两个场景：**
- 撤销 toast: `box-shadow: 0 4px 12px rgba(0,0,0,0.3)` — 仅此一处需要浮起感
- 抽屉面板: `box-shadow: 0 0 0 9999px rgba(0,0,0,0.4)` (backdrop overlay) — 遮罩才是"浮起"

### Named Rules
**The Flat-By-Default Rule.** 表面在静止时是平的。阴影只在需要传达"临时浮起"时出现（toast, drawer overlay）。不要用阴影装饰静止元素。

## 5. Components

### Buttons
- **Shape:** 直角（0px radius）。无圆角、无 pill。
- **Primary:** 纯黑底 + 纯白字 + 10px/20px padding + font-black 0.75rem + 0.15em tracking。Hover: 黑 80% opacity。
- **Secondary:** 透明底 + 2px 纯黑边框 + 黑字。Hover: 黑底白字反转。
- **Ghost:** 黑字 40% opacity + 透明底。Hover: 黑字 100%。

### Inputs
- **Style (Underline):** 透明背景 + 底部 2px 边框（border-black/20）+ 黑字 1rem font-bold。Focus: 边框变纯黑。
- **Style (Box):** 透明背景 + 四边 2px 边框（border-black/20）+ 黑字。Focus: 边框变纯黑。
- **Placeholder:** rgba(0,0,0,0.35) — ≥4.5:1 对比度。
- **Error:** 红色文字 0.75rem font-bold, 置于输入框下方。

### Cards (Ranking)
- **Style:** 2px 边框 + 内容内边距 12px/16px。
- **Red variant:** 红底 #c0392b + 白字。
- **Grey variant:** 白底 + opacity-60 降低整体可见度。
- **Black variant:** 白底 + 黑字（默认）。

### Navigation
- **Header:** 白底 + 底部 2px 边框 + 黑字标题 font-black 0.875rem。
- **Desktop Sidebar:** 白底 + 右侧 2px 边框 + 黑块选中态（bg-black text-white）。
- **Mobile Tab Bar:** 白底 + 顶部 2px 边框 + 黑字选中态。

### Record Columns (Signature)
横向风琴式布局。每列 = 一条记录。背景为 OKLCH 高饱和色。顶部日期（label）+ 中部名称（display，黑字）+ 底部详情（body，70% opacity）+ CTA 按钮（hover 显示）。

### Chart (Scatter Plot)
Chart.js 散点图。三色数据集（红/灰/黑）。Hover tooltip: 黑底白字。Click: 滚动到对应榜单记录。暗色模式: 点加白色描边 + 亮色填充。

## 6. Do's and Don'ts

### Do:
- **Do** use 2px solid borders for all structural elements. 1px is for internal dividers only.
- **Do** use font-black (900) for every label, button, and heading. No exceptions.
- **Do** use 0.15em letter-spacing on all labels and buttons.
- **Do** keep body text at 1rem (16px) minimum. Labels may go to 0.75rem (12px) minimum.
- **Do** use the four OKLCH colors ONLY for record column backgrounds.
- **Do** keep surfaces flat. Shadows only for temporary floating elements (toast, drawer).
- **Do** let the text carry the hierarchy — weight and size, not color.

### Don't:
- **Don't** use rounded corners (border-radius > 0). The only exception is the 3px scrollbar thumb.
- **Don't** use gradient text (`background-clip: text`). This is an absolute ban.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards.
- **Don't** use Inter, Roboto, or any web font. System fonts only.
- **Don't** use cream, sand, beige, or any warm-tinted background. Pure white or pure dark only.
- **Don't** use Material Design components, daisyUI classes, or any third-party UI library styling.
- **Don't** use purple-blue gradients, glassmorphism, or SaaS landing-page clichés.
- **Don't** use more than two font weights per page. The system uses 900 + 700 exclusively.
