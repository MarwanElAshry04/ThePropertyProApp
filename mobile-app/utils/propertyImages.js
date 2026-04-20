// ─── Property Image Pool ──────────────────────────────────────────────────────
// Curated Unsplash photos per property type.
// No API key needed — these are direct photo URLs (free to use under Unsplash license).
// Each property is assigned an image deterministically via: property_id % pool.length
// so the same property always shows the same photo.
// ──────────────────────────────────────────────────────────────────────────────

const IMAGE_POOLS = {
    Villa: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    ],
    Apartment: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
        'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80',
    ],
    Chalet: [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
        'https://images.unsplash.com/photo-1540541338537-4e94695c73cc?w=800&q=80',
        'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80',
    ],
    Penthouse: [
        'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    ],
    Duplex: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    ],
    Townhouse: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
        'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&q=80',
        'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800&q=80',
    ],
    Studio: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80',
    ],

    // ── Catch-all for less common types ───────────────────────────────────────
    Default: [
        'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80',
        'https://images.unsplash.com/photo-1600210491892-03d54bc0e5af?w=800&q=80',
        'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
};

/**
 * Get a deterministic image URL for a property.
 * Same property_id + type always returns the same image.
 *
 * @param {number} propertyId - The property's ID
 * @param {string} type       - Property type (Villa, Apartment, etc.)
 * @returns {string}          - Unsplash image URL
 */
export function getPropertyImage(propertyId, type) {
    const pool = IMAGE_POOLS[type] || IMAGE_POOLS.Default;
    const index = (propertyId || 0) % pool.length;
    return pool[index];
}

/**
 * Get multiple images for a property (for detail screen carousel).
 * Returns up to `count` images, cycling through the pool.
 *
 * @param {number} propertyId
 * @param {string} type
 * @param {number} count - how many images to return (default 4)
 * @returns {string[]}
 */
export function getPropertyImages(propertyId, type, count = 4) {
    const pool = IMAGE_POOLS[type] || IMAGE_POOLS.Default;
    const startIndex = (propertyId || 0) % pool.length;
    const images = [];

    for (let i = 0; i < count; i++) {
        images.push(pool[(startIndex + i) % pool.length]);
    }

    return images;
}