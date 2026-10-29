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
    "terrain": false,
    "profile": false,
    "generative_ai": false,
    "classroom": false
  }
}
