import { getData } from "@/lib/data";
import TeamsView from "@/components/views/TeamsView";

export const metadata = { title: "팀 분석 | KBO 오라클" };

export default async function TeamsPage({ searchParams }: { searchParams: { team?: string } }) {
  return <TeamsView data={await getData()} searchParams={searchParams} />;
}
