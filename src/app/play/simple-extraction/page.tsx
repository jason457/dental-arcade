import type { Metadata } from "next";
import { Player } from "./player";

export const metadata: Metadata = { title: "Simple extraction" };

export default function PlaySimpleExtraction() {
  return <Player />;
}
