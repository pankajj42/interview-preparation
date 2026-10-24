export type LinkKind = 'leetcode' | 'gfg' | 'other';
export interface LinkT { kind: LinkKind; url: string; label?: string; note?: string; premium?: boolean }
export interface ProblemT {
  id: string;
  pid: string | null; // progress id (rows that are the same problem share one)
  title: string;
  num?: number;
  links: LinkT[];
  variants?: ProblemT[];
  also?: { page: string; title: string }[];
}
export interface TopicT { id: string; tid: string; title: string; num?: number; problems: ProblemT[] }
export interface PlaylistT { slug: string; title: string; short?: string; subtitle?: string; source: string; topics: TopicT[] }

export interface DpRow { key: string; name: string; tags: string; diff: string; links: { url: string; text: string }[]; noLink: string | null }
export interface DpGroup { n: number; label: string; title: string; count: string; rows: DpRow[] }
export interface DpPattern { n: number; label: string; eyebrow: string; title: string; search: string; layoutHtml: string; detailsHtml: string }

export interface SdTopic { key: string; level: number; num: string; title: string }
export interface SdPart { slug: string; id: string; title: string; topics: SdTopic[] }

export interface CtciTab { slug: string; title: string; group: 'priority' | 'difficulty' | 'topic'; rows: [number, string, string, string][] }

export type SectionId = 'striver' | 'dp' | 'sd' | 'ctci';
export interface NavItem { label: string; href: string; ids?: string[]; tids?: string[] }
export interface NavGroup { label?: string; items: NavItem[] }
export interface NavSection { id: SectionId; title: string; href: string; blurb: string; groups: NavGroup[]; problemPrefix?: string; topicPrefix?: string; problemTotal: number; topicTotal: number }

export interface CatalogItem { id: string; kind: 'problem' | 'topic'; section: SectionId; title: string; where: string; href: string; also?: number }
