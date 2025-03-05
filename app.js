import React from 'react';
import ReactDOM from 'react-dom';
import { generateTerrainDescription, generateTerrainImage, saveTerrain, likeTerrain, getTerrainList, subscribeToTerrains } from './terrainService.js';
import { formatDate, truncateText, extractBiomeTags } from './utils.js';

const { useState, useEffect, useMemo, useCallback, useSyncExternalStore } = React;

// Main App Component
function App() {
    const [room] = useState(() => new WebsimSocket());
    const [connected, setConnected] = useState(false);
    const [username, setUsername] = useState("");

    useEffect(() => {
        room.onmessage = (event) => {
            const data = event.data;
            if (data.type === "connected") {
                setConnected(true);
                setUsername(room.party.client.username);
            }
        };
    }, [room]);

    return (
        <div className="app-container">
            <header>
                <h1>Infinite Terrain Explorer</h1>
                <p className="tagline">Discover landscapes that don't exist</p>
            </header>
            
            {connected ? (
                <>
                    <ActiveUsers room={room} />
                    <TerrainGenerator room={room} />
                    <TerrainGallery room={room} />
                </>
            ) : (
                <div className="loading-indicator">Connecting to the exploration server...</div>
            )}
        </div>
    );
}

// Component to display active users
function ActiveUsers({ room }) {
    const peers = useSyncExternalStore(
        room.party.subscribe,
        () => room.party.peers
    );

    const peerCount = Object.keys(peers).length;

    return (
        <div className="active-users">
            {peerCount} explorer{peerCount !== 1 ? 's' : ''} currently online
        </div>
    );
}

// Component for generating new terrains
function TerrainGenerator({ room }) {
    const [basePrompt, setBasePrompt] = useState('');
    const [complexity, setComplexity] = useState('moderate');
    const [features, setFeatures] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!basePrompt) {
            setError('Please enter a base concept for your terrain');
            return;
        }
        
        setError('');
        setIsGenerating(true);
        setGeneratedDescription('');
        setGeneratedImageUrl('');
        
        try {
            // Step 1: Generate terrain description
            const description = await generateTerrainDescription(basePrompt, complexity, features);
            setGeneratedDescription(description);
            
            // Step 2: Generate terrain image based on description
            const imageUrl = await generateTerrainImage(description);
            setGeneratedImageUrl(imageUrl);
            
            // Step 3: Save terrain to database
            await saveTerrain(room, description, imageUrl, basePrompt);
            
        } catch (error) {
            console.error("Error in terrain generation process:", error);
            setError('An error occurred during generation. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveToCollection = async () => {
        if (!generatedDescription || !generatedImageUrl) return;
        
        try {
            await saveTerrain(room, generatedDescription, generatedImageUrl, basePrompt);
            setBasePrompt('');
            setFeatures('');
            setGeneratedDescription('');
            setGeneratedImageUrl('');
        } catch (error) {
            setError('Failed to save terrain to collection');
        }
    };

    return (
        <div className="generation-panel">
            <h2>Generate New Terrain</h2>
            <div className="input-group">
                <label htmlFor="base-prompt">Base Concept (required)</label>
                <input
                    id="base-prompt"
                    type="text"
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder="e.g., crystalline mountains, floating islands, underwater city"
                    disabled={isGenerating}
                />
            </div>
            <div className="input-group">
                <label htmlFor="complexity">Complexity</label>
                <select
                    id="complexity"
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    disabled={isGenerating}
                >
                    <option value="simple">Simple</option>
                    <option value="moderate">Moderate</option>
                    <option value="complex">Complex</option>
                    <option value="extremely complex">Extremely Complex</option>
                </select>
            </div>
            <div className="input-group">
                <label htmlFor="features">Special Features (optional)</label>
                <textarea
                    id="features"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="Additional details like climate, vegetation, magical properties, etc."
                    disabled={isGenerating}
                ></textarea>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button onClick={handleGenerate} disabled={isGenerating || !basePrompt}>
                {isGenerating ? <><span className="loading-spinner"></span> Generating...</> : 'Generate Terrain'}
            </button>
            
            {(generatedDescription || generatedImageUrl) && (
                <div className="generation-preview">
                    <h3>Generated Terrain</h3>
                    
                    {generatedDescription && (
                        <div className="preview-card">
                            <h4>Description</h4>
                            <p>{generatedDescription}</p>
                            <div className="biome-tags">
                                {extractBiomeTags(generatedDescription).map((biome, i) => (
                                    <span key={i} className="biome-tag">{biome}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {generatedImageUrl && (
                        <div className="preview-card">
                            <h4>Visualization</h4>
                            <img src={generatedImageUrl} alt="Generated terrain" style={{ width: '100%', borderRadius: '5px' }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Component to display the gallery of terrains
function TerrainGallery({ room }) {
    const terrains = useSyncExternalStore(
        useCallback((callback) => room.collection('terrain').subscribe(callback), [room]),
        useCallback(() => room.collection('terrain').getList(), [room])
    );

    const sortedTerrains = useMemo(() => {
        return [...terrains].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [terrains]);

    const handleLike = async (terrain) => {
        await likeTerrain(room, terrain.id, terrain.likes || 0);
    };

    return (
        <div>
            <h2>Terrain Gallery</h2>
            {sortedTerrains.length === 0 ? (
                <div className="no-terrains">
                    <p>No terrains have been discovered yet. Be the first to generate one!</p>
                </div>
            ) : (
                <div className="terrain-gallery">
                    {sortedTerrains.map((terrain) => (
                        <TerrainCard 
                            key={terrain.id} 
                            terrain={terrain} 
                            onLike={() => handleLike(terrain)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Individual terrain card component
function TerrainCard({ terrain, onLike }) {
    const biomes = terrain.biomes ? terrain.biomes.split(', ') : ['unknown'];
    
    return (
        <div className="terrain-card">
            <img 
                src={terrain.imageUrl} 
                alt={truncateText(terrain.description, 20)} 
                className="terrain-image"
            />
            <div className="terrain-details">
                <h3 className="terrain-title">{truncateText(terrain.basePrompt, 30)}</h3>
                <div>
                    {biomes.map((biome, i) => (
                        <span key={i} className="biome-tag">{biome}</span>
                    ))}
                </div>
                <p className="terrain-description">{terrain.description}</p>
                <div className="terrain-meta">
                    <div className="user-info">
                        <img src={`https://images.websim.ai/avatar/${terrain.username}`} alt="Avatar" className="avatar" />
                        <span>{terrain.username}</span>
                    </div>
                    <span>{formatDate(terrain.created_at)}</span>
                </div>
                <button onClick={onLike} className="like-button">
                    ❤️ {terrain.likes || 0}
                </button>
            </div>
        </div>
    );
}

// Render the application
ReactDOM.render(<App />, document.getElementById('root'));

