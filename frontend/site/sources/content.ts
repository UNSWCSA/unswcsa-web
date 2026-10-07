/** Public read contracts only; storage schema and admin write APIs remain separate. */
export interface ReadOptions {
  signal?: AbortSignal
}

export type ReadResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found' }
  | { status: 'error'; message: string; retryable: boolean }

/** Loading is UI state, not a completed source response. */
export type ReadState<T> = { status: 'loading' } | ReadResult<T>

export interface ImageReference {
  url: string
  alt: string
}

export interface LinkReference {
  label: string
  url: string
}

export interface SiteSettings {
  chineseName: string
  englishName: string
  generalEmail: string | null
  businessEmail: string | null
  socialLinks: Partial<Record<'instagram' | 'xiaohongshu' | 'wechat' | 'douyin' | 'eventbrite', LinkReference>>
}

export interface HomeContent {
  slogan: string
  introduction: string[]
  honors: string[]
  groupPhoto: ImageReference | null
  joinIntroduction: string
}

export interface AboutContent {
  positioning: string
  mission: string[]
  history: string[]
  verifiedRelationships: string[]
}

export interface Department {
  id: string
  name: string
  introduction: string
  image: ImageReference | null
}

export interface TeamYear {
  year: number
  members: Array<{ name: string; role: string; photo: ImageReference | null }>
}

export interface JoinContent {
  reasons: string[]
  departmentIds: string[]
  process: string[]
  faq: Array<{ question: string; answer: string }>
  recruitment:
    | { status: 'closed' }
    | {
        status: 'open'
        /** ISO 8601 timestamps with explicit timezone offset or Z. */
        opensAt: string | null
        deadline: string
        openDepartmentIds: string[]
        application: LinkReference
      }
}

/** One consistent published snapshot; never includes drafts or editor identities. */
export interface PublishedContent {
  releaseId: string
  codeSha: string
  publishedAt: string
  settings: SiteSettings
  /** null means content is not yet supplied, not a business state such as closed. */
  home: HomeContent | null
  about: AboutContent | null
  departments: Department[]
  currentTeamYear: number | null
  teams: TeamYear[]
  join: JoinContent | null
}

export interface ContentSource {
  /** Fetch the deployed public snapshot, not GitHub or authenticated draft APIs. */
  readPublished(options?: ReadOptions): Promise<ReadResult<PublishedContent>>
}
