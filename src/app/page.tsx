import { AppHeader } from "@/components/AppHeader";
import { PhotoEditor } from "@/components/PhotoEditor";
import { ProviderSetupNotice } from "@/components/ProviderSetupNotice";
import { getProviderSetupStatus } from "@/lib/image-provider";

export const dynamic = "force-dynamic";

export default function Home() {
  const provider = getProviderSetupStatus();

  return (
    <div className="flex min-h-full flex-col bg-stone-50">
      <AppHeader providerLabel={provider.label} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <ProviderSetupNotice status={provider} />
        <PhotoEditor providerLabel={provider.label} />
      </main>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            PortraitLab AI · AI-edited photos are for convenience only. Always
            verify official document photo rules yourself.
          </p>
          <p>
            Photos are sent to {provider.label} for processing and are not saved
            by this app.
          </p>
        </div>
      </footer>
    </div>
  );
}
