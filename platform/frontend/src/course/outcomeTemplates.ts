export interface OutcomeTemplate {
  id: 'proposal' | 'summary' | 'report'
  label: string
  titleHint: string
  summaryHint: string
  content: string
}

export const outcomeTemplates: OutcomeTemplate[] = [
  {
    id: 'proposal', label: '倡议书', titleHint: '关于……的倡议书', summaryHint: '用一句话说明倡议希望改变什么。',
    content: '# 致……\n\n## 我们观察到的现象\n\n## 证据与依据\n\n## 我们的倡议\n\n1. \n\n## 倡议人与日期\n',
  },
  {
    id: 'summary', label: '研究总结', titleHint: '……的研究总结', summaryHint: '用一句话概括主要发现。',
    content: '# 研究问题\n\n## 方法与资料\n\n## 主要发现\n\n## 解释与局限\n\n## 下一步\n',
  },
  {
    id: 'report', label: '调查报告', titleHint: '……调查报告', summaryHint: '用一句话说明调查结论。',
    content: '# 调查目的\n\n## 调查对象与方法\n\n## 数据与结果\n\n## 分析\n\n## 结论与建议\n',
  },
]
