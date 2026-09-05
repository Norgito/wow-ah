import type { APIRoute } from 'astro';
import { getAuctions, searchItems, getItemMedia, getItemData, getPetIndex } from '../../utils/battlenet';
import { getTsmRegionMap } from '../../utils/tsm';

let cachedPetIndex: any = null;
const globalVariantIlvlCache = new Map<string, number | null>();

const REALM_MAP: Record<string, {name: string, population: string}> = {
  "4": {
    "name": "Kilrogg",
    "population": "Low"
  },
  "5": {
    "name": "Proudmoore",
    "population": "Full"
  },
  "9": {
    "name": "Kil'jaeden",
    "population": "Medium"
  },
  "11": {
    "name": "Tichondrius",
    "population": "Full"
  },
  "12": {
    "name": "Silver Hand",
    "population": "Low"
  },
  "47": {
    "name": "Eitrigg",
    "population": "Low"
  },
  "52": {
    "name": "Alleria",
    "population": "Medium"
  },
  "53": {
    "name": "Hellscream",
    "population": "Full"
  },
  "54": {
    "name": "Blackhand",
    "population": "Low"
  },
  "55": {
    "name": "Whisperwind",
    "population": "Medium"
  },
  "57": {
    "name": "Illidan",
    "population": "Full"
  },
  "58": {
    "name": "Stormreaver",
    "population": "Low"
  },
  "60": {
    "name": "Stormrage",
    "population": "Full"
  },
  "61": {
    "name": "Zul'jin",
    "population": "Full"
  },
  "63": {
    "name": "Durotan",
    "population": "Low"
  },
  "64": {
    "name": "Bloodhoof",
    "population": "Low"
  },
  "67": {
    "name": "Elune",
    "population": "Medium"
  },
  "69": {
    "name": "Arthas",
    "population": "Low"
  },
  "71": {
    "name": "Warsong",
    "population": "Full"
  },
  "73": {
    "name": "Bleeding Hollow",
    "population": "High"
  },
  "75": {
    "name": "Argent Dawn",
    "population": "Low"
  },
  "76": {
    "name": "Sargeras",
    "population": "Full"
  },
  "77": {
    "name": "Azgalor",
    "population": "New Players"
  },
  "78": {
    "name": "Magtheridon",
    "population": "Low"
  },
  "84": {
    "name": "Dragonmaw",
    "population": "High"
  },
  "86": {
    "name": "Silvermoon",
    "population": "High"
  },
  "96": {
    "name": "Eonar",
    "population": "High"
  },
  "99": {
    "name": "Llane",
    "population": "Low"
  },
  "100": {
    "name": "Earthen Ring",
    "population": "Low"
  },
  "104": {
    "name": "Malygos",
    "population": "High"
  },
  "106": {
    "name": "Aggramar",
    "population": "Full"
  },
  "113": {
    "name": "Suramar",
    "population": "Medium"
  },
  "114": {
    "name": "Dragonblight",
    "population": "Low"
  },
  "115": {
    "name": "Draenor",
    "population": "Low"
  },
  "117": {
    "name": "Bronzebeard",
    "population": "Low"
  },
  "118": {
    "name": "Feathermoon",
    "population": "Low"
  },
  "120": {
    "name": "Darkspear",
    "population": "Low"
  },
  "121": {
    "name": "Azjol-Nerub",
    "population": "High"
  },
  "125": {
    "name": "Shadow Council",
    "population": "Medium"
  },
  "127": {
    "name": "Firetree",
    "population": "High"
  },
  "151": {
    "name": "Runetotem",
    "population": "Low"
  },
  "154": {
    "name": "Detheroc",
    "population": "Low"
  },
  "155": {
    "name": "Kalecgos",
    "population": "Low"
  },
  "157": {
    "name": "Dark Iron",
    "population": "Low"
  },
  "158": {
    "name": "Greymane",
    "population": "Low"
  },
  "160": {
    "name": "Staghelm",
    "population": "Medium"
  },
  "162": {
    "name": "Emerald Dream",
    "population": "High"
  },
  "163": {
    "name": "Maelstrom",
    "population": "Medium"
  },
  "1070": {
    "name": "Alexstrasza",
    "population": "Low"
  },
  "1071": {
    "name": "Kirin Tor",
    "population": "Low"
  },
  "1072": {
    "name": "Ravencrest",
    "population": "Low"
  },
  "1129": {
    "name": "Agamaggan",
    "population": "High"
  },
  "1136": {
    "name": "Aegwynn",
    "population": "New Players"
  },
  "1138": {
    "name": "Chromaggus",
    "population": "Medium"
  },
  "1147": {
    "name": "Kul Tiras",
    "population": "Low"
  },
  "1151": {
    "name": "Rexxar",
    "population": "Low"
  },
  "1168": {
    "name": "Cairne",
    "population": "High"
  },
  "1171": {
    "name": "Wyrmrest Accord",
    "population": "High"
  },
  "1175": {
    "name": "Trollbane",
    "population": "High"
  },
  "1184": {
    "name": "Vek'nilash",
    "population": "Low"
  },
  "1185": {
    "name": "Sen'jin",
    "population": "High"
  },
  "1190": {
    "name": "Baelgun",
    "population": "Low"
  },
  "1425": {
    "name": "Drakkari",
    "population": "New Players"
  },
  "1426": {
    "name": "Aerie Peak",
    "population": "Medium"
  },
  "1427": {
    "name": "Ragnaros",
    "population": "Full"
  },
  "1428": {
    "name": "Quel'Thalas",
    "population": "Full"
  },
  "3207": {
    "name": "Goldrinn",
    "population": "Low"
  },
  "3208": {
    "name": "Nemesis",
    "population": "Low"
  },
  "3209": {
    "name": "Azralon",
    "population": "High"
  },
  "3234": {
    "name": "Gallywix",
    "population": "New Players"
  },
  "3661": {
    "name": "Hyjal",
    "population": "High"
  },
  "3675": {
    "name": "Moon Guard",
    "population": "Full"
  },
  "3676": {
    "name": "Area 52",
    "population": "Full"
  },
  "3678": {
    "name": "Thrall",
    "population": "Full"
  },
  "3683": {
    "name": "Dalaran",
    "population": "Full"
  },
  "3684": {
    "name": "Mal'Ganis",
    "population": "Full"
  },
  "3685": {
    "name": "Turalyon",
    "population": "Low"
  },
  "3693": {
    "name": "Kel'Thuzad",
    "population": "High"
  },
  "3694": {
    "name": "Lightbringer",
    "population": "Medium"
  },
  "3721": {
    "name": "Caelestrasz",
    "population": "High"
  },
  "3723": {
    "name": "Barthilas",
    "population": "High"
  },
  "3725": {
    "name": "Frostmourne",
    "population": "Full"
  },
  "3726": {
    "name": "Khaz'goroth",
    "population": "High"
  }
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const realmParam = url.searchParams.get('realm') || '3676';

        const idsParam = url.searchParams.get('ids');

        if ((!query || query.trim().length < 2) && !idsParam) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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

        const expansionParam = url.searchParams.get('expansion') || 'all';

        async function getWowheadIlvl(itemId: number, bonusStr: string) {
            try {
                const wUrl = bonusStr ? `https://www.wowhead.com/item=${itemId}?bonus=${bonusStr}&xml` : `https://www.wowhead.com/item=${itemId}&xml`;
                const res = await fetch(wUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const xml = await res.text();
                const match = xml.match(/<level>(\d+)<\/level>/);
                return match ? parseInt(match[1]) : null;
            } catch (e) {
                return null;
            }
        }

        // Create a map of matching item IDs to their names and expansions
        const itemMap = new Map();
        const petMap = new Map();
        
        if (idsParam) {
            // Directly fetch data for the given comma-separated IDs
            const tokens = idsParam.split(',').map(s => s.trim());
            const itemIds = tokens.filter((t: string) => !t.startsWith('pet-')).map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));
            const petSpeciesIds = tokens.filter((t: string) => t.startsWith('pet-')).map((id: string) => parseInt(id.split('-')[1])).filter((id: number) => !isNaN(id));

            if (itemIds.length === 0 && petSpeciesIds.length === 0) {
                return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            await Promise.all(itemIds.map(async (id) => {
                const data = await getItemData(id);
                if (data) {
                    const name = data.name.en_US || data.name;
                    const exp = getExpansion(id);
                    if (expansionParam === 'all' || exp === expansionParam) {
                        itemMap.set(id, { name, expansion: exp });
                    }
                }
            }));

            if (petSpeciesIds.length > 0) {
                if (!cachedPetIndex) {
                    cachedPetIndex = await getPetIndex();
                }
                if (cachedPetIndex && cachedPetIndex.pets) {
                    const requestedPetSet = new Set(petSpeciesIds);
                    for (const pet of cachedPetIndex.pets) {
                        if (requestedPetSet.has(pet.id)) {
                            const petName = typeof pet.name === 'string' ? pet.name : (pet.name.en_US || '');
                            petMap.set(pet.id, { name: petName, expansion: 'Battle Pet' });
                        }
                    }
                }
            }
        } else {
            // 1. Search for items matching the query
            const searchResult = await searchItems(query!);
            const matchingItems = searchResult?.results || [];
            
            const cleanQuery = query!.trim();
            const normQuery = cleanQuery.toLowerCase().replace(/['"’`]/g, '');
            const queryWords = normQuery.split(/\s+/).filter(Boolean);

            for (const match of matchingItems) {
                const name = match.data.name?.en_US || match.data.name;
                if (!name) continue;
                const normName = name.toLowerCase().replace(/['"’`]/g, '');

                // Ensure item contains all query words
                if (!queryWords.every((w: string) => normName.includes(w))) {
                    continue;
                }

                const exp = getExpansion(match.data.id);
                if (expansionParam === 'all' || exp === expansionParam) {
                    itemMap.set(match.data.id, { name, expansion: exp });
                }
            }

            if (!cachedPetIndex) {
                cachedPetIndex = await getPetIndex();
            }
            if (cachedPetIndex && cachedPetIndex.pets) {
                for (const pet of cachedPetIndex.pets) {
                    const petName = typeof pet.name === 'string' ? pet.name : (pet.name?.en_US || '');
                    if (!petName) continue;
                    const normPetName = petName.toLowerCase().replace(/['"’`]/g, '');
                    if (queryWords.every((w: string) => normPetName.includes(w))) {
                        petMap.set(pet.id, { name: petName, expansion: 'Battle Pet' });
                    }
                }
            }
        }
        
        if (itemMap.size === 0 && petMap.size === 0) {
            return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Fetch Realm-Specific Auctions
        const realmIds = realmParam === 'all' ? Object.keys(REALM_MAP) : [realmParam];
        
        const allAuctions = [];
        const BATCH_SIZE = 15;
        
        for (let i = 0; i < realmIds.length; i += BATCH_SIZE) {
            const batch = realmIds.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(async (rId) => {
                    try {
                        const data = await getAuctions(rId);
                        const aucs = data.auctions || [];
                        // Filter matching items early to save memory
                        return aucs
                            .filter((a: any) => {
                                if (!(a.buyout || a.unit_price)) return false;
                                if (a.item.id === 82800) return petMap.has(a.item.pet_species_id);
                                return itemMap.has(a.item.id);
                            })
                            .map((a: any) => {
                                const realmInfo = REALM_MAP[rId];
                                const isPet = a.item.id === 82800;
                                const itemInfo = isPet ? petMap.get(a.item.pet_species_id) : itemMap.get(a.item.id);
                                return {
                                    ...a,
                                    realmName: realmInfo ? `[${realmInfo.population}] ${realmInfo.name}` : rId,
                                    itemName: itemInfo?.name || 'Unknown',
                                    itemExpansion: itemInfo?.expansion || 'Unknown',
                                    isPet
                                };
                            });
                    } catch (e) {
                        console.error('Failed fetching realm', rId, e);
                        return [];
                    }
                })
            );
            allAuctions.push(...batchResults);
        }

        // Flatten the array of arrays
        const rawAuctions = allAuctions.flat();

        // 3. Extract unique variants for Wowhead resolving
        const uniqueVariants = new Set();
        for (const auction of rawAuctions) {
            if (auction.isPet) continue;
            const bonusStr = (auction.item.bonus_lists || []).join(':');
            uniqueVariants.add(`${auction.item.id}-${bonusStr}`);
        }

        const variantArray = Array.from(uniqueVariants).slice(0, 200); // limit to 200
        
        await Promise.all(variantArray.map(async (variantHash: any) => {
            if (globalVariantIlvlCache.has(variantHash)) {
                return; // Already cached
            }
            const [itemId, bonusStr] = variantHash.split('-');
            const ilvl = await getWowheadIlvl(parseInt(itemId), bonusStr);
            if (ilvl !== null) {
                globalVariantIlvlCache.set(variantHash, ilvl);
            }
        }));

        // 4. Group by Item ID + iLvl, and track realm prices
        const groupedAuctions = new Map();
        for (const auction of rawAuctions) {
            let groupHash, itemId, ilvl;
            
            if (auction.isPet) {
                itemId = auction.item.pet_species_id;
                ilvl = auction.item.pet_level || 1;
                groupHash = `pet-${itemId}-${ilvl}`;
            } else {
                itemId = auction.item.id;
                const bonusStr = (auction.item.bonus_lists || []).join(':');
                const variantHash = `${itemId}-${bonusStr}`;
                ilvl = globalVariantIlvlCache.get(variantHash);
                if (!ilvl) ilvl = 0;
                groupHash = `${itemId}-${ilvl}`;
            }
            
            if (!groupedAuctions.has(groupHash)) {
                groupedAuctions.set(groupHash, {
                    itemId: itemId,
                    ilvl: ilvl,
                    isPet: auction.isPet,
                    itemName: auction.itemName,
                    itemExpansion: auction.itemExpansion,
                    quantity: 0,
                    realmPrices: new Map() // realmName -> minPrice
                });
            }
            
            const group = groupedAuctions.get(groupHash);
            group.quantity += (auction.quantity || 1);
            
            const price = auction.buyout || auction.unit_price || 0;
            if (price > 0) {
                const currentMin = group.realmPrices.get(auction.realmName);
                if (!currentMin || price < currentMin) {
                    group.realmPrices.set(auction.realmName, price);
                }
            }
        }

        let topGroups = Array.from(groupedAuctions.values());

        // 5. Resolve icons and base iLvl (if Wowhead failed)
        const regularGroups = topGroups.filter((g: any) => !g.isPet);
        const uniqueItemIds = [...new Set(regularGroups.map((v: any) => v.itemId))];
        const itemMetadataCache = new Map();
        
        await Promise.all(uniqueItemIds.map(async (id) => {
            const [itemData, mediaData] = await Promise.all([
                getItemData(id as number),
                getItemMedia(id as number)
            ]);
            
            let iconUrl = '';
            if (mediaData && mediaData.assets) {
                const iconAsset = mediaData.assets.find((a: any) => a.key === 'icon');
                if (iconAsset) iconUrl = iconAsset.value;
            }
            
            itemMetadataCache.set(id, { 
                icon: iconUrl, 
                baseIlvl: itemData?.level || itemData?.preview_item?.level?.value || 0 
            });
        }));

        let tsmMap: Map<number, any> | null = null;
        try {
            tsmMap = await getTsmRegionMap('us');
        } catch (e) {
            // TSM lookup failure is non-fatal
        }

        const resolvedAuctions = topGroups.map((group: any) => {
            let finalIlvl, iconUrl;
            if (group.isPet) {
                finalIlvl = group.ilvl;
                iconUrl = 'https://render.worldofwarcraft.com/us/icons/56/inv_box_petcarrier_01.jpg';
            } else {
                const meta = itemMetadataCache.get(group.itemId) || { icon: '', baseIlvl: 0 };
                finalIlvl = group.ilvl > 0 ? group.ilvl : meta.baseIlvl;
                iconUrl = meta.icon;
            }

            // Sort realms to get top 10 cheapest and top 10 most expensive
            const sortedRealms = Array.from(group.realmPrices.entries())
                .map(([realmName, price]) => ({ realmName, price }))
                .sort((a: any, b: any) => a.price - b.price); // Ascending

            const top10Cheapest = sortedRealms.slice(0, 10);
            const top10Expensive = [...sortedRealms].sort((a: any, b: any) => b.price - a.price).slice(0, 10);

            const minBuyout = top10Cheapest.length > 0 ? top10Cheapest[0].price : 0;
            const maxBuyout = top10Expensive.length > 0 ? top10Expensive[0].price : 0;
            const minBuyoutGold = minBuyout / 10000;

            const tsm = (!group.isPet && tsmMap) ? tsmMap.get(group.itemId) : null;
            let dealDiscount = 0;
            if (tsm && tsm.marketValue > 0 && minBuyoutGold > 0 && minBuyoutGold < tsm.marketValue) {
                dealDiscount = Math.round(((tsm.marketValue - minBuyoutGold) / tsm.marketValue) * 100);
            }

            return {
                id: group.isPet ? `pet-${group.itemId}-${finalIlvl}` : `${group.itemId}-${finalIlvl}`,
                itemId: group.itemId,
                name: group.itemName,
                expansion: group.itemExpansion,
                icon: iconUrl,
                ilvl: finalIlvl,
                top10Cheapest,
                top10Expensive,
                minBuyout,
                maxBuyout,
                quantity: group.quantity,
                tsmStats: tsm ? {
                    saleRate: tsm.saleRate,
                    soldPerDay: tsm.soldPerDay,
                    marketValue: tsm.marketValue,
                    avgSalePrice: tsm.avgSalePrice,
                    dealDiscount: dealDiscount >= 15 ? dealDiscount : 0
                } : null
            };
        });

        resolvedAuctions.sort((a, b) => a.minBuyout - b.minBuyout);
        const finalResults = resolvedAuctions.slice(0, 500);

        return new Response(JSON.stringify(finalResults), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
