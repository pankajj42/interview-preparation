import HomeView from '@/components/HomeView';
import { buildNav, dp, dpPid, dpGroupTid, leaves, playlists, sdParts, sdTid, uniq } from '@/lib/catalog';

export default function Home() {
  const segments = {
    striver: playlists.flatMap((pl) => pl.topics.map((t) => uniq(t.problems.flatMap(leaves).map((l) => l.pid as string)))),
    dp: dp.groups.map((g) => uniq(g.rows.map((r) => dpPid(r.key)))),
    sd: sdParts.flatMap((p) => p.topics.map((t) => [sdTid(t.key)])),
  };
  void dpGroupTid;
  return <HomeView nav={buildNav()} segments={segments} />;
}
