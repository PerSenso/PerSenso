import { TrazabilidadContent } from './TrazabilidadContent';

export default async function TrazabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <TrazabilidadContent initialId={id} />;
}
