import { redirect } from "next/navigation";

// Education section removed from the website: send visitors to the home page.
export default function RemovedPage() {
  redirect("/");
}
