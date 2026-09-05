import type { APIRoute } from 'astro';
import { getTopSellingItems, type TopSellersOptions } from '../../utils/tsm';
import { getItemIcon } from '../../utils/battlenet';

function getExpansion(itemId: number) {
    if (itemId >= 240000) return 'Midnight';
    if (itemId >= 210000) return 'The War Within';
    if (itemId >= 190000) return 'Dragonflight';
    if (itemId >= 170000) return 'Shadowlands';
    if (itemId >= 150000) return 'Battle for Azeroth';
    if (itemId >= 130000) return 'Legion';
    if (itemId >= 100000) return 'Warlords of Draenor';
    if (itemId >= 70000) return 'Mists of Pandaria';
    if (itemId >= 50000) return 'Cataclysm';
    if (itemId >= 35000) return 'Wrath of the Lich King';
    if (itemId >= 25000) return 'The Burning Crusade';
    return 'Classic';
}

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const sortParam = url.searchParams.get('sort') || 'turnover';
        const minPriceParam = parseFloat(url.searchParams.get('minPrice') || '0');
        const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
        const region = url.searchParams.get('region') || 'us';

        const validSort = (['turnover', 'volume', 'rate'].includes(sortParam) ? sortParam : 'turnover') as TopSellersOptions['sort'];
        const limit = Math.min(Math.max(limitParam, 1), 100);

        const items = await getTopSellingItems({
            sort: validSort,
            minPrice: isNaN(minPriceParam) ? 0 : minPriceParam,
            limit,
            region
        });

        // Resolve icons in parallel batches
        const BATCH_SIZE = 10;
        const resolvedItems = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(async (item) => {
                    let icon = '';
                    try {
                        icon = await getItemIcon(item.itemId);
                    } catch (e) {
                        // ignore media fetch errors
                    }
                    return {
                        ...item,
                        expansion: getExpansion(item.itemId),
                        icon: icon || ''
                    };
                })
            );
            resolvedItems.push(...batchResults);
        }

        return new Response(JSON.stringify(resolvedItems), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=1800, s-maxage=3600' // Cache for 30m in browser/CDN
            }
        });
    } catch (error: any) {
        console.error('Error in /api/best-sellers:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to load best sellers' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
