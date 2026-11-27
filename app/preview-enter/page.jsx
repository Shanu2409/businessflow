import { notFound } from "next/navigation";
import PreviewBootstrap from "./PreviewBootstrap";

export const dynamic = "force-dynamic";

// Preview-only passwordless entry. It exists only on a deployment that is
// both read-only (READ_ONLY_PREVIEW=1) and access-gated (PREVIEW_SECRET set).
// The middleware additionally requires a valid invite session cookie.
// Anywhere else this route is a 404.
export default function PreviewEnter() {
  if (process.env.READ_ONLY_PREVIEW !== "1" || !process.env.PREVIEW_SECRET) {
    notFound();
  }
  return <PreviewBootstrap />;
}
