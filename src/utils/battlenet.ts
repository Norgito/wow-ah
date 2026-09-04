let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getAccessToken() {
    const now = Date.now();
    if (cachedAccessToken && now < tokenExpiresAt) {
        return cachedAccessToken;
    }

    const clientId = import.meta.env?.BATTLENET_CLIENT_ID || process.env.BATTLENET_CLIENT_ID;
    const clientSecret = import.meta.env?.BATTLENET_CLIENT_SECRET || process.env.BATTLENET_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        throw new Error('Battle.net API credentials are not set in the environment variables.');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`https://oauth.battle.net/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error(`Failed to authenticate with Battle.net: ${response.statusText}`);
    }

    const data = await response.json();
    cachedAccessToken = data.access_token;
    // Expire 5 minutes early to avoid using expired tokens
    tokenExpiresAt = now + ((data.expires_in || 86400) - 300) * 1000;
    return cachedAccessToken;
}

function getRegion() {
    return import.meta.env?.BATTLENET_REGION || process.env.BATTLENET_REGION || 'us';
}

export async function getAuctions(realmId: string) {
    const token = await getAccessToken();
    const region = getRegion();
    const url = `https://${region}.api.blizzard.com/data/wow/connected-realm/${realmId}/auctions?namespace=dynamic-${region}&locale=en_US`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch auctions: ${response.statusText}`);
    }

    return response.json();
}

export async function getCommodityAuctions() {
    const token = await getAccessToken();
    const region = getRegion();
    const url = `https://${region}.api.blizzard.com/data/wow/auctions/commodities?namespace=dynamic-${region}&locale=en_US`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch commodity auctions: ${response.statusText}`);
    }

    return response.json();
}

export async function searchItems(query: string) {
    const token = await getAccessToken();
    const region = getRegion();
    // Use orderby=id:desc to prioritize newest expansions first and _pageSize=100 to broaden candidate pool for exact word filtering
    const url = `https://${region}.api.blizzard.com/data/wow/search/item?namespace=static-${region}&name.en_US=${encodeURIComponent(query)}&_pageSize=100&orderby=id:desc`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
}

let cachedPetIndex: any = null;

export async function getPetIndex() {
    if (cachedPetIndex) {
        return cachedPetIndex;
    }

    const token = await getAccessToken();
    const region = getRegion();
    const url = `https://${region}.api.blizzard.com/data/wow/pet/index?namespace=static-${region}&locale=en_US`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return null;
    }

    cachedPetIndex = await response.json();
    return cachedPetIndex;
}

const itemDataCache = new Map<number, any>();

export async function getItemData(itemId: number) {
    if (itemDataCache.has(itemId)) {
        return itemDataCache.get(itemId);
    }

    const token = await getAccessToken();
    const region = getRegion();
    const url = `https://${region}.api.blizzard.com/data/wow/item/${itemId}?namespace=static-${region}&locale=en_US`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    itemDataCache.set(itemId, data);
    return data;
}

const mediaCache = new Map<number, any>();

export async function getItemMedia(itemId: number) {
    if (mediaCache.has(itemId)) {
        return mediaCache.get(itemId);
    }

    const token = await getAccessToken();
    const region = getRegion();
    const url = `https://${region}.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-${region}&locale=en_US`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    mediaCache.set(itemId, data);
    return data;
}

export async function getItemIcon(itemId: number): Promise<string> {
    const media = await getItemMedia(itemId);
    if (media && media.assets) {
        const iconAsset = media.assets.find((a: any) => a.key === 'icon');
        if (iconAsset?.value) {
            return iconAsset.value;
        }
    }
    return '';
}

