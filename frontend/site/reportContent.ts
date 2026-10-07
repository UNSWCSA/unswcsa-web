// Editorial excerpts from the supplied bi-annual report, PDF pages 5–7, 9–30.
// Figures with conflicting definitions and future accomplishments are excluded.
export const introduction = '新南学联成立于 1992 年，陪伴一代代中国留学生走过在 UNSW 的学习与生活。从新生融入、学业与职业发展，到文化交流、体育活动与学生福祉，我们希望让每位同学都能找到参与的机会、同行的伙伴，以及属于自己的归属感。'
// Department descriptions adapted from the supplied 2026 T3 recruitment article.
// Exclude time-limited vacancies and the media paragraph duplicated under Social Activity.
export const departments = [
  { name: '外联部', description: '连接校外企业与品牌，为学联活动争取赞助与支持。从合作洽谈、方案沟通到物资对接与福利发放，外联部将外部资源转化为同学们看得见、用得到的支持，并主导推进「期末加油包」等项目。' },
  { name: '新媒体部', description: '负责学联活动宣传、社交平台运营与原创内容产出，将校园资讯和学联动态传递给同学们。从文案撰写、内容策划到排版编辑与合作商家宣传，新媒体部用创意与表达连接学联和校园生活。' },
  { name: '技术部', description: '以设计、影像和代码为学联提供幕后支持。部门设有平面、摄影、剪辑和 IT 四个小组，分别负责海报与物料设计、活动摄影摄像、视频制作，以及小程序和网站的开发运维，让创意落地，让精彩留存。' },
  { name: '策划部', description: '从创意构思、方案撰写到现场执行与活动复盘，策划部共同完成校园社交活动的全过程。通过迎新派对、徒步、树洞音乐会、校园夜市和周常桌游等多样活动，为同学们创造轻松相识、交流与参与的机会。' },
  { name: '文体部', description: '策划并举办文化、艺术、体育与电竞活动，将传统节庆和共同兴趣带入校园生活。从端午游园会、歌手比赛到足球赛事与电竞活动，文体部通过前期策划、跨部门协作和现场执行，让每一份热爱都有相聚的舞台。' },
  { name: '职规部', description: '连接校园与职场，通过朋辈分享、行业交流与商业案例竞赛，帮助同学探索职业方向、提升职业素养。部门设有策划组、宣传组和周报组，分别推进职业活动与嘉宾联络、宣传物料制作，以及实习机会和企业合作资源的拓展。' },
]
export const honors = [
  [2024, '年度最佳社团奖'], [2024, '校园世界杯足球赛冠军'], [2024, '校园世界杯排球赛冠军'],
  [2025, '年度卓越传播奖'], [2025, '年度最佳大型活动奖'], [2025, '年度最佳团队奖'],
  [2025, '年度学生社区影响大奖'], [2025, '年度文化影响力社团大奖'], [2025, '社团卓越纪念奖'],
  [2026, '校园世界杯足球赛冠军'], [2026, '跨校世界杯足球赛冠军'],
] as const
export const homeHonors = honors.filter((_, i) => [0, 4, 5, 6].includes(i))
export const services = [
  { title: '陪伴新生融入', text: '从国内行前交流、新生社群，到 O-Week、校园导览与迎新活动，帮助同学了解校园、结识伙伴，逐步建立自己的留学生活。' },
  { title: '支持学业与职业发展', text: '通过朋辈互助、选课经验分享、简历与面试交流、行业对话和企业参访，连接学习经验与职业探索的机会。' },
  { title: '连接文化与校园生活', text: '以传统节庆、音乐、体育、桌游和兴趣交流，让不同专业、年级与兴趣的同学找到自己的参与方式。' },
  { title: '关注学生福祉', text: '开展安全教育、健康与学业支持信息分享及考试季支持，帮助同学了解并连接学校的专业服务资源。' },
]
export const history = [
  { year: '1992', text: '新南学联成立，开始陪伴中国留学生的学习与校园生活。' },
  { year: '2024', text: '推出学联会员卡，探索将合作资源转化为学生日常生活中的支持。' },
  { year: '2025', text: '启用全新 Logo，推出原创吉祥物「新南威尔狮」。' },
  { year: '2026', text: '推出「新南威尔狮」系列原创表情包，进一步将学联形象融入校园日常。' },
]
export const joinReasons = [
  { title: '把想法变成现实', text: '参与策划、设计、传播、协调与现场执行，在真实项目中积累经验。' },
  { title: '找到同行的伙伴', text: '在共同协作和服务同学的过程中认识朋友，建立校园里的连接与归属。' },
  { title: '拓展视野与经历', text: '通过学联的行业交流、校友分享与跨校合作，接触不同领域的经验。' },
  { title: '让经验继续传承', text: '在团队工作中学习，也把实践中的方法与收获留给下一届成员。' },
]
const roles = ['主席', '副主席', '副主席', '秘书长', '财务', 'Arc Delegate', '外联部部长', '新媒体部部长', '技术部部长', '策划部部长', '文体部部长', '职规部部长']
// Year labels follow the confirmed website convention; retain source terms for provenance.
export const reportTeams = [
  { year: '2026', term: '2025/2026', names: ['Ada Choi', 'Kimmie Zhou', 'Esther Li', 'Devin Ma', 'Serena Chen', 'Angie Liu', 'Chrissy Liu', 'Ellier Ou', 'Sky Fan', 'Joanne Su', 'Vik Qin', 'Felcia Li'] },
  { year: '2025', term: '2024/2025', names: ['Ada Choi', 'Irene Xu', 'Chloe Tsoi', 'Jacqueline Huang', 'Esther Yu', 'Kimmie Zhou', 'Selena Qin', 'Selina Kong', 'Zoe Xu', 'Joanne Su', 'Fran Liao', 'Esther Li'] },
].map(team => ({ ...team, members: team.names.map((name, i) => ({ name, role: roles[i], photo: `/images/team:${team.year}/${name.startsWith('Esther ') ? name.replace(' ', '-') : name.split(' ')[0]}.png` })) }))
