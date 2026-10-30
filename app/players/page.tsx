import { getData } from "@/lib/data";
import PlayersView from "@/components/views/PlayersView";

export const metadata = { title: "선수 기록 | KBO 오라클" };

export default async function PlayersPage({ searchParams }: { searchParams: { q?: string } }) {
  return <PlayersView data={await getData()} searchParams={searchParams} />;
}
