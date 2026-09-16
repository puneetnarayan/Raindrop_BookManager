import { Collection, Resource, Space } from "@/lib/validation/schemas";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function resourcesToCsv(resources: Resource[], spaces: Space[], collections: Collection[]): string {
  const header = [
    "title",
    "url",
    "description",
    "domain",
    "tags",
    "space",
    "collection",
    "favorite",
    "pinned",
    "archived",
    "createdAt",
  ];

  const rows = resources.map((r) => {
    const space = spaces.find((s) => s.id === r.spaceId)?.name ?? "";
    const collection = collections.find((c) => c.id === r.collectionId)?.name ?? "";
    return [
      r.title,
      r.url,
      r.description ?? "",
      r.domain ?? "",
      r.tags.join(";"),
      space,
      collection,
      String(r.favorite),
      String(r.pinned),
      String(r.archived),
      r.createdAt,
    ]
      .map((v) => csvEscape(v))
      .join(",");
  });

  return [header.join(","), ...rows].join("\n") + "\n";
}
