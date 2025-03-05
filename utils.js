// Utility functions for the Infinite Terrain Explorer

// Generate a random seed value
export function generateRandomSeed() {
    return Math.floor(Math.random() * 1000000);
}

// Extract biome tags from a description
export function extractBiomeTags(description) {
    const commonBiomes = [
        'desert', 'forest', 'jungle', 'tundra', 'mountains', 'plains', 
        'swamp', 'marsh', 'ocean', 'lake', 'river', 'island', 'cave',
        'valley', 'canyon', 'hills', 'volcano', 'glacier', 'reef',
        'savanna', 'grassland', 'beach', 'arctic', 'oasis', 'wasteland'
    ];
    
    const biomes = [];
    const lowerDesc = description.toLowerCase();
    
    commonBiomes.forEach(biome => {
        if (lowerDesc.includes(biome) && !biomes.includes(biome)) {
            biomes.push(biome);
        }
    });
    
    return biomes.length > 0 ? biomes : ['unknown'];
}

// Format a date for display
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Generate a prompt for image generation based on terrain description
export function generateImagePrompt(terrainDescription) {
    return `A stunningly detailed and photorealistic landscape visualization of the following terrain: ${terrainDescription}. 
    Wide angle, dramatic lighting, atmospheric perspective, 8k resolution, detailed textures.`;
}

// Truncate text to a certain length
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

