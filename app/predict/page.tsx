import { getData } from "@/lib/data";
import PredictView from "@/components/views/PredictView";

export const metadata = { title: "승부예측 | KBO 오라클" };

export default async function PredictPage() {
  return <PredictView data={await getData()} />;
}
