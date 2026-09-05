export interface TsmItemRecord {
    itemId: number;
    name: string;
    marketValue: number; // in gold
    historical: number;  // in gold
    avgSalePrice: number;// in gold
    saleRate: number;    // 0.0 to 1.0
    soldPerDay: number;  // estimated sold per day
    dailyTurnoverGold: number; // soldPerDay * avgSalePrice
    updatedAt?: string;
}

let cachedRegionMap: Map<number, TsmItemRecord> | null = null;
let lastCacheTime = 0;
let inflightFetch: Promise<Map<number, TsmItemRecord>> | null = null;

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Fetches and parses the TSM region items CSV file with in-memory caching.
 */
export async function getTsmRegionMap(region: string = 'us'): Promise<Map<number, TsmItemRecord>> {
    const now = Date.now();
    if (cachedRegionMap && (now - lastCacheTime < CACHE_TTL_MS)) {
        return cachedRegionMap;
    }

    if (inflightFetch) {
        return inflightFetch;
    }

    inflightFetch = (async () => {
        try {
            const url = `https://public-data.tradeskillmaster.com/retail/${region}/region/items.csv`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'WoW-AH-Dashboard/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch TSM data: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            const lines = text.trim().split('\n');
            const map = new Map<number, TsmItemRecord>();

            // Header format: itemId,name,marketValue,historical,avgSalePrice,saleRate,soldPerDay,updatedAt
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Parse CSV fields (names might have commas or special characters, but standard split handles ID/numbers safely)
                const firstComma = line.indexOf(',');
                const secondComma = line.indexOf(',', firstComma + 1);
                if (firstComma === -1 || secondComma === -1) continue;

                const itemIdStr = line.substring(0, firstComma);
                const itemId = parseInt(itemIdStr, 10);
                if (isNaN(itemId)) continue;

                // Grab remaining columns from the end: updatedAt, soldPerDay, saleRate, avgSalePrice, historical, marketValue
                const parts = line.split(',');
                if (parts.length < 8) continue;

                const updatedAt = parts[parts.length - 1];
                const soldPerDay = parseFloat(parts[parts.length - 2]) || 0;
                const saleRate = parseFloat(parts[parts.length - 3]) || 0;
                const avgSalePriceCopper = parseInt(parts[parts.length - 4], 10) || 0;
                const historicalCopper = parseInt(parts[parts.length - 5], 10) || 0;
                const marketValueCopper = parseInt(parts[parts.length - 6], 10) || 0;
                
                // Name is between the first column and the numeric price columns
                const name = parts.slice(1, parts.length - 6).join(',');

                const marketValue = Math.round((marketValueCopper / 10000) * 100) / 100;
                const historical = Math.round((historicalCopper / 10000) * 100) / 100;
                const avgSalePrice = Math.round((avgSalePriceCopper / 10000) * 100) / 100;
                const dailyTurnoverGold = Math.round(soldPerDay * avgSalePrice);

                map.set(itemId, {
                    itemId,
                    name,
                    marketValue,
                    historical,
                    avgSalePrice,
                    saleRate,
                    soldPerDay: Math.round(soldPerDay * 10) / 10,
                    dailyTurnoverGold,
                    updatedAt
                });
            }

            cachedRegionMap = map;
            lastCacheTime = Date.now();
            return map;
        } catch (error) {
            console.error('Error fetching TSM region data:', error);
            // Return existing cache if available on error, otherwise empty map
            return cachedRegionMap || new Map();
        } finally {
            inflightFetch = null;
        }
    })();

    return inflightFetch;
}

/**
 * Look up TSM market statistics for a specific WoW item.
 */
export async function getTsmItemStats(itemId: number, region: string = 'us'): Promise<TsmItemRecord | null> {
    try {
        const map = await getTsmRegionMap(region);
        return map.get(itemId) || null;
    } catch {
        return null;
    }
}

export interface TopSellersOptions {
    sort?: 'turnover' | 'volume' | 'rate';
    minPrice?: number; // min avgSalePrice in gold
    limit?: number;
    region?: string;
}

/**
 * Returns top-performing items based on sales velocity, daily turnover, or volume.
 */
export async function getTopSellingItems(options: TopSellersOptions = {}): Promise<TsmItemRecord[]> {
    const {
        sort = 'turnover',
        minPrice = 0,
        limit = 50,
        region = 'us'
    } = options;

    const map = await getTsmRegionMap(region);
    let items = Array.from(map.values());

    // Filter out low price noise if requested
    if (minPrice > 0) {
        items = items.filter(item => item.avgSalePrice >= minPrice || item.marketValue >= minPrice);
    }

    // Filter items with minimal activity
    items = items.filter(item => item.soldPerDay > 0.1 && item.saleRate > 0.01);

    if (sort === 'volume') {
        items.sort((a, b) => b.soldPerDay - a.soldPerDay);
    } else if (sort === 'rate') {
        // High sale rate, with secondary sort by volume
        items.sort((a, b) => {
            if (Math.abs(b.saleRate - a.saleRate) > 0.05) {
                return b.saleRate - a.saleRate;
            }
            return b.soldPerDay - a.soldPerDay;
        });
    } else {
        // Default: daily gold turnover
        items.sort((a, b) => b.dailyTurnoverGold - a.dailyTurnoverGold);
    }

    return items.slice(0, limit);
}
