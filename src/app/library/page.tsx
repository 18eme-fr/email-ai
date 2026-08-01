import { Suspense } from "react";
import { LibraryView } from "@/components/topics/library-view";

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-muted-foreground">
          Chargement de la bibliothèque…
        </div>
      }
    >
      <LibraryView />
    </Suspense>
  );
}
