import { extractBiomeTags, generateImagePrompt } from './utils.js';

export async function generateTerrainDescription(basePrompt, complexity, features) {
    try {
        const prompt = `
        Create a vivid and detailed description of a fictional terrain or landscape that doesn't exist in our world.
        Base concept: ${basePrompt}
        Complexity level: ${complexity}
        Special features: ${features}
        
        Your response should be a paragraph of 3-5 sentences that describes this terrain in rich, evocative detail.
        Include geographical features, climate, colors, and atmosphere. Mention any unusual or fantastical elements.
        Make it feel like a location from a fantasy world or alien planet.
        `;
        
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a master worldbuilder specializing in creating unique and imaginative fictional terrains and landscapes. Your descriptions are vivid, evocative, and make the impossible seem real."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        
        return completion.content;
    } catch (error) {
        console.error("Error generating terrain description:", error);
        throw error;
    }
}

export async function generateTerrainImage(terrainDescription) {
    try {
        const imagePrompt = generateImagePrompt(terrainDescription);
        
        const result = await websim.imageGen({
            prompt: imagePrompt,
            aspect_ratio: "16:9",
        });
        
        return result.url;
    } catch (error) {
        console.error("Error generating terrain image:", error);
        throw error;
    }
}

export async function saveTerrain(room, terrainDescription, imageUrl, basePrompt) {
    try {
        const biomes = extractBiomeTags(terrainDescription);
        
        const terrain = await room.collection('terrain').create({
            description: terrainDescription,
            imageUrl: imageUrl,
            basePrompt: basePrompt,
            biomes: biomes.join(', '),
            likes: 0
        });
        
        return terrain;
    } catch (error) {
        console.error("Error saving terrain:", error);
        throw error;
    }
}

export async function likeTerrain(room, terrainId, currentLikes) {
    try {
        await room.collection('terrain').update(terrainId, {
            likes: currentLikes + 1
        });
    } catch (error) {
        console.error("Error liking terrain:", error);
        throw error;
    }
}

export function getTerrainList(room) {
    return room.collection('terrain').getList();
}

export function subscribeToTerrains(room, callback) {
    return room.collection('terrain').subscribe(callback);
}

