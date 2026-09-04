import type { APIRoute } from 'astro';
import { searchItems, getItemIcon, getPetIndex } from '../../utils/battlenet';

function normalizeText(text: string): string {
    return text.toLowerCase().replace(/['"’`]/g, '');
}

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');

        if (!query || query.trim().length < 3) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const cleanQuery = query.trim();
        const normQuery = normalizeText(cleanQuery);
        const queryWords = normQuery.split(/\s+/).filter(Boolean);

        const searchResult = await searchItems(cleanQuery);
        const matchingItems = searchResult?.results || [];
        
        // Filter items: MUST contain ALL words from the search query
        const filteredMatches = matchingItems.filter((match: any) => {
            const name = match.data.name?.en_US || match.data.name;
            if (!name) return false;
            const normName = normalizeText(name);
            return queryWords.every((word: string) => normName.includes(word));
        });

        // Sort by relevance:
        // 1. Exact match
        // 2. Starts with query
        // 3. Contains exact query as a continuous phrase
        // 4. Newer items first (id:desc)
        filteredMatches.sort((a: any, b: any) => {
            const nameA = normalizeText(a.data.name?.en_US || a.data.name || '');
            const nameB = normalizeText(b.data.name?.en_US || b.data.name || '');

            const exactA = nameA === normQuery ? 1 : 0;
            const exactB = nameB === normQuery ? 1 : 0;
            if (exactA !== exactB) return exactB - exactA;

            const startsA = nameA.startsWith(normQuery) ? 1 : 0;
            const startsB = nameB.startsWith(normQuery) ? 1 : 0;
            if (startsA !== startsB) return startsB - startsA;

            const phraseA = nameA.includes(normQuery) ? 1 : 0;
            const phraseB = nameB.includes(normQuery) ? 1 : 0;
            if (phraseA !== phraseB) return phraseB - phraseA;

            return (b.data.id || 0) - (a.data.id || 0);
        });

        // Extract unique items
        const uniqueNames = new Set<string>();
        const candidateItems: Array<{ id: number; name: string; isPet?: boolean; quality?: string }> = [];

        for (const match of filteredMatches) {
            const name = match.data.name?.en_US || match.data.name;
            if (name && !uniqueNames.has(name)) {
                uniqueNames.add(name);
                candidateItems.push({
                    id: match.data.id,
                    name: name,
                    quality: match.data.quality?.type?.toLowerCase()
                });
            }
            
            // Limit to top 10 suggestions for fast response
            if (candidateItems.length >= 10) break;
        }

        // Also check pets if we have room, ensuring they contain all query words
        if (candidateItems.length < 10) {
            try {
                const petIndex = await getPetIndex();
                if (petIndex && petIndex.pets) {
                    for (const pet of petIndex.pets) {
                        const petName = typeof pet.name === 'string' ? pet.name : (pet.name?.en_US || '');
                        if (!petName) continue;
                        const normPetName = normalizeText(petName);
                        if (queryWords.every((w: string) => normPetName.includes(w)) && !uniqueNames.has(petName)) {
                            uniqueNames.add(petName);
                            candidateItems.push({
                                id: pet.id,
                                name: petName,
                                isPet: true
                            });
                        }
                        if (candidateItems.length >= 10) break;
                    }
                }
            } catch (err) {
                console.error("Error fetching pet index for suggestions:", err);
            }
        }

        const suggestions = await Promise.all(
            candidateItems.map(async (item) => {
                let icon = '';
                if (item.isPet) {
                    icon = 'https://render.worldofwarcraft.com/us/icons/56/inv_box_petcarrier_01.jpg';
                } else {
                    try {
                        icon = await getItemIcon(item.id);
                    } catch (e) {
                        console.error(`Failed to load icon for item ${item.id}`, e);
                    }
                }

                return {
                    id: item.id,
                    name: item.name,
                    icon: icon,
                    quality: item.quality,
                    isPet: !!item.isPet
                };
            })
        );

        return new Response(JSON.stringify(suggestions), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
            }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
