import type { RankedResult } from '@/types/ranking'
import { POSTER_MAX_ITEMS } from '@/config/constants'

export interface PosterConfig {
  type: 'red' | 'black'
  title: string
  subtitle: string
  footer: string
  results: RankedResult[]
  maxItems?: number
}

function buildPosterHTML(config: PosterConfig): string {
  const { type, title, subtitle, footer, results, maxItems = POSTER_MAX_ITEMS } = config
  const displayResults = results.slice(0, maxItems)
  const isRed = type === 'red'
  const accentColor = isRed ? '#b5343a' : '#5b4a3f'
  const headerBg = isRed
    ? 'linear-gradient(135deg, #8b3a3a, #b5343a)'
    : 'linear-gradient(135deg, #3d2e24, #5b4a3f)'

  const topMedalColors = ['#d4a853', '#9c8e7c', '#b45309']

  const rows = displayResults.map((r, i) => {
    const rankColor = i < 3 ? topMedalColors[i] : '#c4b8a8'
    return `<div style="display:flex;align-items:center;padding:14px 24px;border-bottom:1px solid #e8e0d5;background:${i%2===0?'#fff':'#faf7f2'}">
      <div style="font-size:28px;font-weight:900;color:${rankColor};width:48px;text-align:center;flex-shrink:0">${i + 1}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;font-weight:700;color:#2c2416;margin-bottom:3px;line-height:1.4;word-break:break-word">${esc(r.name)}</div>
        <div style="font-size:12px;color:#8b7355;margin-top:2px">¥${r.price.toFixed(2)} · ${esc(r.category)} · ${esc(r.date)}</div>
      </div>
      <div style="font-size:28px;font-weight:800;color:${accentColor};margin-left:12px;flex-shrink:0">${r.mappedScore.toFixed(1)}</div>
    </div>`
  }).join('')

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=800"><title>观演红黑榜</title></head>
<body style="width:800px;margin:0;padding:0;background:#faf7f2;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;">
<div style="background:${headerBg};padding:36px 30px;text-align:center;color:white">
  <div style="font-size:40px;font-weight:900;margin-bottom:6px;letter-spacing:2px">${esc(title)}</div>
  <div style="font-size:20px;opacity:0.85">${esc(subtitle)}</div>
</div>
<div>${rows}</div>
<div style="text-align:center;padding:18px;color:#9c8e7c;font-size:14px;background:#f5f0e8;border-top:1px solid #e8e0d5">${esc(footer)}</div>
</body></html>`
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export async function generatePoster(config: PosterConfig): Promise<void> {
  const html = buildPosterHTML(config)

  // 方案：新窗口渲染 → html2canvas 截图 → 关闭窗口
  const win = window.open('', '_blank', 'width=830,height=900')
  if (!win) {
    // 弹窗被拦截，备选：直接下载 HTML
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `榜单_${config.type}_${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  win.document.write(html)
  win.document.close()

  // 等待渲染
  await new Promise<void>(resolve => {
    win.onload = () => setTimeout(resolve, 600)
    // 兜底
    setTimeout(resolve, 1500)
  })

  try {
    // 在新窗口中使用 html2canvas
    const { default: html2canvas } = await import('html2canvas')
    const c = await html2canvas(win.document.body, {
      scale: 2,
      backgroundColor: '#faf7f2',
      logging: false,
      windowWidth: 800,
      windowHeight: win.document.body.scrollHeight,
    })

    const link = document.createElement('a')
    link.download = `榜单_${config.type}_${Date.now()}.png`
    link.href = c.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    console.error('海报截图失败，使用 HTML 备选:', e)
    // 备选：下载为 HTML 文件
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `榜单_${config.type}_${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    win.close()
  }
}

export function preparePosterResults(results: RankedResult[], type: 'red' | 'black'): RankedResult[] {
  if (type === 'red') {
    return results.filter(r => r.rankClass === 'red').sort((a, b) => b.mappedScore - a.mappedScore)
  }
  return results.filter(r => r.rankClass === 'black').sort((a, b) => a.mappedScore - b.mappedScore)
}
