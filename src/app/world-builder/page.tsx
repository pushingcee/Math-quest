import dynamic from 'next/dynamic';

const WorldBuilder = dynamic(
  () => import('@/components/world-builder/WorldBuilder'),
  { ssr: false }
);

export default function WorldBuilderPage() {
  return <WorldBuilder />;
}
