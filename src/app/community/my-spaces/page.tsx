import { redirect } from "next/navigation";

export default function LegacyMySpacesRedirect() {
  redirect("/community");
}
