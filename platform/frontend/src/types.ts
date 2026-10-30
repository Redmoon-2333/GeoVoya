export interface FieldNode {
  id: string
  code: string
  title: string
  resource_id: string
  altitude_m: number | null
  latitude: number | null
  longitude: number | null
  panorama_url: string | null
  status: string
  location_status: string
}

export interface Resource {
  id: string
  title: string
  kind: string
  image: string
  thumbnail: string
  filename: string
  focus: string
  node_id: string
  source: string
  source_version: string
  scope: string
}

export interface PanoramaHotspot {
  id: string
  title: string
  yaw: string
  pitch: string
  prompt: string
}

export interface PanoramaSample {
  id: string
  title: string
  image: string
  filename: string
  source: string
  source_version: string
  scope: string
  status: string
  hotspots: PanoramaHotspot[]
}

export interface VegetationZone {
  id: string
  order: number
  title: string
  short_title: string
  color: string
  node_ids: string[]
  status: string
  prompt: string
  note: string
}

export interface GuideReply {
  mode: 'knowledge_pack'
  question: string
  answer: string
  sources: string[]
  matched_card_id: string | null
  page: string
  node_id: string | null
  theme_id: string
  disclaimer: string
}

export interface ResearchQuestion {
  id: string
  title: string
  prompt: string
}

export interface Theme {
  id: string
  title: string
  subtitle: string
  question: string
  status: string
  resource_ids: string[]
  questions: ResearchQuestion[]
}

export interface SavedRecord {
  id: string
  created_at: string
  updated_at: string
}

export interface Observation extends SavedRecord {
  node_id: string
  fact: string
  evidence: string
  question: string
}

export interface Favorite extends SavedRecord {
  resource_id: string
  source: string
  source_version: string
}

export interface AnalysisFields {
  favorite_id: string
  theme_id: string
  question_id: string
  observed: string
  meaning: string
  missing: string
  role: 'uncertain' | 'support' | 'weaken' | 'background'
  scope: string
  on_board: boolean
}

export interface Analysis extends SavedRecord, AnalysisFields {}

export interface ArtifactFields {
  theme_id: string
  title: string
  summary: string
  content: string
  evidence_ids: string[]
  status: 'draft' | 'archived'
}

export interface Artifact extends SavedRecord, ArtifactFields {
  version: number
}

export interface Attachment extends SavedRecord {
  artifact_id: string
  filename: string
  size: number
}

export interface Step {
  id: string
  title: string
  done: boolean
  description: string
  href: string
}

export interface Feedback {
  steps: Step[]
  completed_steps: number
  counts: Record<'observations' | 'favorites' | 'analyses' | 'board' | 'artifacts', number>
  dimensions: { title: string; status: string; note: string }[]
  teacher_status: string
}

export interface Bootstrap {
  catalog: {
    version: string
    title: string
    subtitle: string
    nodes: FieldNode[]
    resources: Resource[]
    panorama_samples: PanoramaSample[]
    vegetation_zones: VegetationZone[]
    guide_prompts: string[]
    knowledge_cards: { id: string; title: string; sources: string[] }[]
    themes: Theme[]
    capabilities: Record<string, boolean>
  }
  progress: { last_node: string | null; theme_id: string } | null
  observations: Observation[]
  favorites: Favorite[]
  analyses: Analysis[]
  artifacts: Artifact[]
  reflection: { text: string } | null
  feedback: Feedback
}
