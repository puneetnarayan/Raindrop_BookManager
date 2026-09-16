import { SpaceView } from "@/components/spaces/SpaceView";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  return <SpaceView spaceId={spaceId} />;
}
