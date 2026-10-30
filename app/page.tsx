import { getData } from "@/lib/data";
import HomeView from "@/components/views/HomeView";

export default async function Home() {
  return <HomeView data={await getData()} />;
}
