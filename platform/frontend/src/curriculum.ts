export const bands = [
  { id: 'evergreen', title: '常绿阔叶林', range: '700 m 以下', note: '关注叶片特征、群落层次与林下环境。' },
  { id: 'mixed', title: '常绿—落叶阔叶混交林', range: '850–1100 m', note: '需要结合季节资料，比较常绿与落叶成分。' },
  { id: 'deciduous', title: '落叶阔叶林', range: '1100–1380 m', note: '观察群落结构，寻找不同季节的比较依据。' },
  { id: 'dwarf', title: '落叶矮林', range: '1380–1506 m', note: '比较植株高度，并考虑风、温度与地形。' },
]

export const topicDrafts: Record<string, { questions: string[]; needs: string; product: string }> = {
  cryptomeria: { questions: ['识别可见现象', '寻找比较对象', '提出可能解释', '检验证据与解释', '说明局限与建议'], needs: '健康与受损样点、树龄、土壤 pH、酸沉降及病虫害资料', product: '古树保护建议书' },
  bamboo: { questions: ['识别毛竹分布', '比较不同时期边界', '分析环境与经营因素', '检验群落影响', '提出管理建议'], needs: '多期遥感影像、竹阔混交林对照、土壤与经营记录', product: '毛竹扩张调查报告' },
  relict: { questions: ['认识孑遗植物', '比较分布与生境', '回溯第四纪环境', '检验避难所假设', '提出生境保护建议'], needs: '经核验的物种与分布点、地形气候资料、古环境研究', product: '孑遗植物保护解说' },
  tea: { questions: ['观察茶园环境', '比较海拔与坡向', '联系水热与土壤', '检验适生条件', '权衡利用与保护'], needs: '茶园样点、温湿度与云雾记录、土壤及经营资料', product: '云雾茶适生条件报告' },
}

export const knowledge = [
  { id: 'vegetation', category: '植被', title: '西天目山的四个植被带', text: '课程资料列出：700 m 以下常绿阔叶林，850–1100 m 常绿—落叶阔叶混交林，1100–1380 m 落叶阔叶林，1380–1506 m 落叶矮林。植被变化具有过渡性，700–850 m 不应被解释为没有植被。', source: '天目山土壤与气候的垂直地带性 · §1；答-P0优先确认事项 · 问题10', tags: ['海拔', '带谱', '垂直地带性'] },
  { id: 'soil', category: '土壤', title: '土壤与植被的垂直分异', text: '资料整理的土壤带为：600 m 以下以红壤为主，600–1200 m 以黄壤为主，1200 m 以上以棕黄壤为主。土壤带与植被带不必一一重合，还需考虑母质、水热条件与生物作用。', source: '天目山土壤与气候的垂直地带性 · §1', tags: ['红壤', '黄壤', '海拔'] },
  { id: 'water', category: '土壤', title: '表层土壤含水率：比较同一研究', text: '整理稿转录的 2022 年东南坡调查中，400、800、1000、1300、1500 m 的 0–20 cm 表层土壤含水率均值分别为 27.36%、35.12%、40.40%、42.51%、43.89%。这是特定研究的样地数据，不能赋给当前照片。原始文献与转录精度待地理组复核。', source: '天目山土壤与气候的垂直地带性 · 表2-1', tags: ['含水率', '对照', '数据'] },
  { id: 'climate', category: '气候', title: '海拔变化怎样影响植被？', text: '随海拔升高，热量条件发生变化。比较植被时还要结合坡向、土壤与水分条件；不能仅根据一张照片，把群落差异归因于海拔。不同研究与季节的土壤湿度并非总呈同一单调序列。', source: '植物地理学野外实习 · §1.2.2；天目山土壤与气候的垂直地带性 · §2.1.1', tags: ['水热', '坡向', '温度'] },
  { id: 'method', category: '方法', title: '先描述现象，再提出解释', text: '观察记录写清画面中的位置和可辨认特征；把“树冠较稀疏”等描述与“由酸雨导致”等解释分开。检验解释需补充健康样点、时间信息和相关环境资料，也要寻找反例。', source: '修改 · V0.4 · 科考档案馆；答-P0优先确认事项 · 柳杉专题', tags: ['柳杉', '证据', '观察'] },
  { id: 'season', category: '方法', title: '夏秋对比需要可比较的素材', text: '判断常绿与落叶特征，需要同地点、可比较视角和明确拍摄时间的季节材料。现有对接文件计划在 11 月补采秋景；在素材到位之前，不把不同点位照片标为季节对照。', source: '答-P0优先确认事项 · 问题8、11', tags: ['季节', '常绿', '落叶'] },
]

export function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
