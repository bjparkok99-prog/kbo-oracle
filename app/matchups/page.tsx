import { getData } from "@/lib/data";
import MatchupsView from "@/components/views/MatchupsView";

export const metadata = { title: "상대전적 | KBO 오라클" };

export default async function MatchupsPage({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  return <MatchupsView data={await getData()} searchParams={searchParams} />;
}
