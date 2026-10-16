import { getHomeHeading, getHomeSummary } from "../lib/site";

export default function HomePage() {
  return (
    <main>
      <h1>{getHomeHeading()}</h1>
      <p>{getHomeSummary()}</p>
    </main>
  );
}
