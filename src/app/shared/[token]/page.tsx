import { notFound } from "next/navigation";
import { readData } from "@/lib/data/store";
import { PublicResourceList, PublicResource } from "@/components/shared/PublicResourceList";
import { MarkdownView } from "@/components/common/MarkdownView";
import { Globe } from "lucide-react";

// Renders fresh on every request — a share can be revoked and that must take effect immediately.
export const dynamic = "force-dynamic";

function toPublicResource(r: {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  thumbnail?: string;
  domain?: string;
  tags: string[];
}): PublicResource {
  // Deliberately only the fields safe to show a stranger — no notes, no
  // internal status fields, no timestamps.
  return {
    id: r.id,
    url: r.url,
    title: r.title,
    description: r.description,
    favicon: r.favicon,
    thumbnail: r.thumbnail,
    domain: r.domain,
    tags: r.tags,
  };
}

async function loadPublicData() {
  const [{ data: spaces }, { data: collections }, { data: resources }] = await Promise.all([
    readData("spaces"),
    readData("collections"),
    readData("resources"),
  ]);
  return { spaces, collections, resources };
}

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let data: Awaited<ReturnType<typeof loadPublicData>>;
  try {
    data = await loadPublicData();
  } catch {
    return (
      <PublicPageShell name="Temporarily unavailable">
        <p className="text-sm text-neutral-500">
          This shared page couldn&apos;t load right now. Please try again in a moment.
        </p>
      </PublicPageShell>
    );
  }
  const { spaces, collections, resources } = data;

  const space = spaces.find((s) => s.shareToken === token && s.shareMode === "public" && !s.trash && !s.archived);
  const collection = collections.find(
    (c) => c.shareToken === token && c.shareMode === "public" && !c.trash && !c.archived
  );

  if (!space && !collection) {
    notFound();
  }

  if (space) {
    const spaceCollections = collections
      .filter((c) => c.spaceId === space.id && !c.trash && !c.archived)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const spaceResources = resources.filter((r) => r.spaceId === space.id && !r.trash && !r.archived);

    return (
      <PublicPageShell name={space.name} description={space.description}>
        {space.notes && (
          <div className="mb-6 rounded-md bg-black/[0.03] p-4 dark:bg-white/5">
            <MarkdownView content={space.notes} />
          </div>
        )}
        {spaceCollections.length === 0 ? (
          <PublicResourceList resources={spaceResources.map(toPublicResource)} />
        ) : (
          <div className="space-y-8">
            {spaceCollections.map((c) => {
              const collectionResources = spaceResources.filter((r) => r.collectionId === c.id);
              if (collectionResources.length === 0) return null;
              return (
                <section key={c.id}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                    {c.name}
                  </h2>
                  <PublicResourceList resources={collectionResources.map(toPublicResource)} />
                </section>
              );
            })}
          </div>
        )}
      </PublicPageShell>
    );
  }

  const collectionResources = resources.filter(
    (r) => r.collectionId === collection!.id && !r.trash && !r.archived
  );

  return (
    <PublicPageShell name={collection!.name} description={collection!.description}>
      {collection!.notes && (
        <div className="mb-6 rounded-md bg-black/[0.03] p-4 dark:bg-white/5">
          <MarkdownView content={collection!.notes} />
        </div>
      )}
      <PublicResourceList resources={collectionResources.map(toPublicResource)} />
    </PublicPageShell>
  );
}

function PublicPageShell({
  name,
  description,
  children,
}: {
  name: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
          <Globe size={16} className="text-emerald-600" />
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Shared, read-only
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-2 p-6">
        <h1 className="text-2xl font-semibold">{name}</h1>
        {description && <p className="mb-4 text-sm text-neutral-500">{description}</p>}
        <div className="pt-4">{children}</div>
      </main>
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400 dark:border-neutral-800">
        Shared from Raindrop BookManager
      </footer>
    </div>
  );
}
