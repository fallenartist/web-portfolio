import { getPayload } from 'payload';
import config from '@payload-config';
import Treemap from '@/components/Treemap/Treemap';
import { fetchTreemapData } from '@/lib/transformers';

export default async function Home() {
  // Initialize Payload
  const payload = await getPayload({ config });

  // Fetch and transform data
  const { treemapData } = await fetchTreemapData(payload);

  return (
	<main className="min-h-screen">
	  <Treemap data={treemapData} baseUrl="/" />
	</main>
  );
}