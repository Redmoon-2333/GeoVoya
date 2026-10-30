export const demoCatalog = {
  "version": "prototype-2026-10-15",
  "title": "天目·寻境",
  "subtitle": "西天目山自然地理虚拟研学",
  "nodes": [
    {
      "id": "sample-01",
      "code": "01",
      "title": "林下与地表",
      "resource_id": "photo-floor",
      "altitude_m": null,
      "latitude": null,
      "longitude": null,
      "panorama_url": null,
      "status": "photo_only",
      "location_status": "待地理组核验采集点"
    },
    {
      "id": "sample-02",
      "code": "02",
      "title": "树干与周边植被",
      "resource_id": "photo-detail",
      "altitude_m": null,
      "latitude": null,
      "longitude": null,
      "panorama_url": null,
      "status": "photo_only",
      "location_status": "待地理组核验采集点"
    },
    {
      "id": "sample-03",
      "code": "03",
      "title": "仰视林冠",
      "resource_id": "photo-canopy",
      "altitude_m": null,
      "latitude": null,
      "longitude": null,
      "panorama_url": null,
      "status": "photo_only",
      "location_status": "待地理组核验采集点"
    }
  ],
  "resources": [
    {
      "id": "photo-floor",
      "title": "林下与地表",
      "image": "/media/forest-floor.webp",
      "thumbnail": "/media/forest-floor-thumb.webp",
      "filename": "IMG_20260820_111143.jpg",
      "focus": "先描述画面中可见的植被层次、地表覆盖与倒木。",
      "kind": "photo",
      "node_id": "sample-01",
      "source": "团队提供 / 天目山柳杉照片-2026 / 天目山照片-202608 / 普通照片-ziyao / IMG_20260820_111143.jpg",
      "source_version": "local-photo-v1",
      "scope": "普通实景照片；采集坐标、海拔与物种鉴定尚待核验。"
    },
    {
      "id": "photo-detail",
      "title": "树干与周边植被",
      "image": "/media/forest-detail.webp",
      "thumbnail": "/media/forest-detail-thumb.webp",
      "filename": "IMG_20260820_122236.jpg",
      "focus": "记录树干表面与周围植物的可见特征，区分观察与解释。",
      "kind": "photo",
      "node_id": "sample-02",
      "source": "团队提供 / 天目山柳杉照片-2026 / 天目山照片-202608 / 普通照片-ziyao / IMG_20260820_122236.jpg",
      "source_version": "local-photo-v1",
      "scope": "普通实景照片；采集坐标、海拔与物种鉴定尚待核验。"
    },
    {
      "id": "photo-canopy",
      "title": "仰视林冠",
      "image": "/media/forest-canopy.webp",
      "thumbnail": "/media/forest-canopy-thumb.webp",
      "filename": "IMG_20260820_124918.jpg",
      "focus": "观察枝叶与光照。单张照片不用于判断长期变化或确定成因。",
      "kind": "photo",
      "node_id": "sample-03",
      "source": "团队提供 / 天目山柳杉照片-2026 / 天目山照片-202608 / 普通照片-ziyao / IMG_20260820_124918.jpg",
      "source_version": "local-photo-v1",
      "scope": "普通实景照片；采集坐标、海拔与物种鉴定尚待核验。"
    }
  ],
  "panorama_samples": [
    {
      "id": "panorama-sample-01",
      "title": "天目山全景样例",
      "image": "/media/tianmu-panorama.webp",
      "filename": "CAM_20260818103558_0030_D.JPG",
      "source": "团队提供 / 天目山全景图片-202608 / CAM_001 / CAM_20260818103558_0030_D.JPG",
      "source_version": "local-panorama-v1",
      "scope": "本地等距柱状全景技术样例；拍摄点、带谱归属和路线位置尚待地理组核验。",
      "status": "technical_sample",
      "hotspots": [
        {
          "id": "canopy",
          "title": "林冠观察",
          "yaw": "32deg",
          "pitch": "8deg",
          "prompt": "观察林冠的层次、疏密和光照，不先判断成因。"
        },
        {
          "id": "trunk",
          "title": "树干观察",
          "yaw": "-42deg",
          "pitch": "-4deg",
          "prompt": "记录树干和周围植被的可见特征，区分事实与推测。"
        },
        {
          "id": "ground",
          "title": "地表观察",
          "yaw": "118deg",
          "pitch": "-18deg",
          "prompt": "留意地表覆盖、倒木和更新情况，并写下需要补充的对照。"
        }
      ]
    }
  ],
  "vegetation_zones": [
    {
      "id": "evergreen-broadleaf",
      "order": 1,
      "title": "常绿阔叶林带",
      "short_title": "常绿阔叶",
      "color": "#4d8a63",
      "node_ids": [],
      "status": "awaiting_content",
      "prompt": "先从群落外貌、叶片类型和林下环境寻找可观察差异。",
      "note": "代表节点与典型范围待地理组核验后绑定。"
    },
    {
      "id": "evergreen-deciduous-mixed",
      "order": 2,
      "title": "常绿—落叶阔叶混交林带",
      "short_title": "常绿—落叶混交",
      "color": "#7ca36a",
      "node_ids": [],
      "status": "awaiting_content",
      "prompt": "关注群落中常绿与落叶成分的共存，以及过渡性的表现。",
      "note": "不把带界线理解为突然变化；具体节点待内容确认。"
    },
    {
      "id": "deciduous-broadleaf",
      "order": 3,
      "title": "落叶阔叶林带",
      "short_title": "落叶阔叶",
      "color": "#b4a75f",
      "node_ids": [],
      "status": "awaiting_content",
      "prompt": "比较林冠季相、叶片类型和林下光照，记录可核查事实。",
      "note": "季节性材料与代表节点待地理组核验后补充。"
    },
    {
      "id": "deciduous-dwarf",
      "order": 4,
      "title": "落叶矮林带",
      "short_title": "落叶矮林",
      "color": "#a8794e",
      "node_ids": [],
      "status": "awaiting_content",
      "prompt": "观察植被高度、风环境线索和群落结构，避免只凭海拔下结论。",
      "note": "代表节点、范围和过渡说明待地理组核验。"
    }
  ],
  "guide_prompts": [
    "什么是植被垂直地带性？",
    "我应该怎样观察一张照片？",
    "柳杉衰退可以怎样提出研究问题？",
    "二维沙盘现在可以怎么用？"
  ],
  "knowledge_cards": [
    {
      "id": "vertical-zonation",
      "title": "垂直地带性",
      "sources": [
        "课程知识包·垂直地带性",
        "《植物地理学野外实习》相关材料"
      ]
    },
    {
      "id": "observe-before-explain",
      "title": "先观察再解释",
      "sources": [
        "研学方法提示·观察—解释—证据"
      ]
    },
    {
      "id": "cryptomeria-inquiry",
      "title": "柳杉衰退研究路径",
      "sources": [
        "柳杉衰退专题问题链",
        "课程方案·证据分析要求"
      ]
    },
    {
      "id": "sandbox-use",
      "title": "二维沙盘",
      "sources": [
        "首版方案·二维垂直带谱沙盘"
      ]
    }
  ],
  "themes": [
    {
      "id": "cryptomeria",
      "title": "柳杉衰退",
      "subtitle": "从现象识别到多因素解释",
      "question": "如何识别可能的衰退现象，哪些证据能检验不同解释？",
      "status": "prototype",
      "resource_ids": [
        "photo-floor",
        "photo-detail",
        "photo-canopy"
      ],
      "questions": [
        {
          "id": "symptoms",
          "title": "识别可见现象",
          "prompt": "照片中具体能看到什么？哪些还需要现场核实？"
        },
        {
          "id": "compare",
          "title": "寻找比较对象",
          "prompt": "要判断差异，需要怎样的健康样点或其他对照？"
        },
        {
          "id": "explain",
          "title": "提出可能解释",
          "prompt": "尝试提出解释，并指出它需要哪些数据支持。"
        },
        {
          "id": "test",
          "title": "检验证据与解释",
          "prompt": "哪些资料支持或削弱解释？资料是否适用于当前地点？"
        },
        {
          "id": "limits",
          "title": "说明局限与建议",
          "prompt": "目前还不能确定什么？下一步优先补充什么？"
        }
      ]
    },
    {
      "id": "bamboo",
      "title": "毛竹扩张",
      "subtitle": "分布变化与群落比较",
      "question": "毛竹分布是否发生变化，怎样区分观察与变化证据？",
      "status": "awaiting_content",
      "resource_ids": [],
      "questions": []
    },
    {
      "id": "relict",
      "title": "孑遗植物避难所",
      "subtitle": "生境比较与保护",
      "question": "地形和生境如何为孑遗植物提供适生条件？",
      "status": "awaiting_content",
      "resource_ids": [],
      "questions": []
    },
    {
      "id": "tea",
      "title": "高山云雾茶",
      "subtitle": "水热条件与适生环境",
      "question": "哪些环境条件影响茶树生长，证据的适用范围是什么？",
      "status": "awaiting_content",
      "resource_ids": [],
      "questions": []
    }
  ],
  "capabilities": {
    "photographs": true,
    "panorama": false,
    "local_panorama": true,
    "sandbox_2d": true,
    "knowledge_guide": true,
    "terrain": false,
    "profile": false,
    "generative_ai": false,
    "classroom": false
  }
}

export const demoGuideCards = [
  {
    "id": "vertical-zonation",
    "title": "垂直地带性",
    "keywords": [
      "垂直地带性",
      "带谱",
      "植被带",
      "海拔"
    ],
    "answer": "山地中，温度、水分、土壤和坡位等条件会随高度和生境变化，植被群落也会呈现有规律的垂直分异。带界线通常具有过渡性，因此研学时应比较群落外貌和环境线索，不把某一海拔值当成唯一判据。",
    "sources": [
      "课程知识包·垂直地带性",
      "《植物地理学野外实习》相关材料"
    ]
  },
  {
    "id": "observe-before-explain",
    "title": "先观察再解释",
    "keywords": [
      "观察",
      "照片",
      "事实",
      "解释",
      "证据"
    ],
    "answer": "先写能够直接在画面中核查的事实，再写这些事实可能说明什么，最后列出还需要的对照或调查。单张照片可以支持可见现象，不能单独证明长期变化、物种身份或因果关系。",
    "sources": [
      "研学方法提示·观察—解释—证据"
    ]
  },
  {
    "id": "cryptomeria-inquiry",
    "title": "柳杉衰退研究路径",
    "keywords": [
      "柳杉",
      "衰退",
      "成因",
      "病虫害",
      "土壤",
      "酸沉降"
    ],
    "answer": "可以从个体和群落的可见现象开始，寻找健康样点或其他对照，再结合海拔、生境、树龄、土壤 pH、酸沉降和病虫害等资料提出多因素解释。每一种解释都要写清需要什么证据来支持或削弱，不能由单张图片直接下结论。",
    "sources": [
      "柳杉衰退专题问题链",
      "课程方案·证据分析要求"
    ]
  },
  {
    "id": "sandbox-use",
    "title": "二维沙盘",
    "keywords": [
      "沙盘",
      "定位点",
      "导航",
      "四个植被带",
      "带谱"
    ],
    "answer": "当前原型的沙盘是二维垂直带谱示意图。点击带谱可以查看该带的观察提示，待地理组交付代表节点后，再把定位点与具体实景场景绑定。它不是精确地形测量图，也不代替真实经纬度或 DEM。",
    "sources": [
      "首版方案·二维垂直带谱沙盘"
    ]
  }
]
