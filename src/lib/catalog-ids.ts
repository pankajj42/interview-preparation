// id helpers that are safe to import from client components (no node:fs)
export const dpPid = (key: string) => `p:dp:${key}`;
export const dpPatternTid = (n: number) => `t:dp:pattern:${n}`;
export const dpGroupTid = (n: number) => `t:dp:group:${n}`;
export const sdTid = (key: string) => `t:sd:${key}`;
export const ctciPid = (slug: string) => `p:ctci:${slug}`;
export const ctciTid = (tab: string) => `t:ctci:${tab}`;
