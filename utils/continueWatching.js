const STORAGE_KEY = 'crisprflix_continue_watching';
const MAX_ITEMS = 20;

export const getContinueWatching = () => {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading continue watching from localStorage', error);
        return [];
    }
};

export const addToContinueWatching = (movie, season = null, episode = null, server = null) => {
    if (typeof window === 'undefined' || !movie) return;

    try {
        const currentList = getContinueWatching();
        
        // Remove the movie if it already exists (to move it to the front)
        const filteredList = currentList.filter(item => item.id !== movie.id);
        
        // Prepare movie data with optional season/episode/server
        const movieData = { 
            ...movie, 
            lastWatchedSeason: season, 
            lastWatchedEpisode: episode,
            lastWatchedServer: server,
            updatedAt: new Date().toISOString()
        };
        
        // Add to the front
        const newList = [movieData, ...filteredList].slice(0, MAX_ITEMS);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        
        // Dispatch a custom event so other components can listen for changes
        window.dispatchEvent(new Event('continueWatchingUpdated'));
    } catch (error) {
        console.error('Error saving continue watching to localStorage', error);
    }
};

export const removeFromContinueWatching = (movieId) => {
    if (typeof window === 'undefined') return;

    try {
        const currentList = getContinueWatching();
        const newList = currentList.filter(item => item.id !== movieId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        window.dispatchEvent(new Event('continueWatchingUpdated'));
    } catch (error) {
        console.error('Error removing from continue watching', error);
    }
};

export const updateEpisodeProgress = (movieId, season, episode, progress) => {
    if (typeof window === 'undefined') return;

    try {
        const STORAGE_KEY_PROGRESS = `crisprflix_progress_${movieId}`;
        const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
        const progressData = data ? JSON.parse(data) : {};
        
        const key = `s${season}e${episode}`;
        progressData[key] = progress;
        
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressData));
        window.dispatchEvent(new Event('episodeProgressUpdated'));
    } catch (error) {
        console.error('Error updating episode progress', error);
    }
};

export const getEpisodeProgress = (movieId) => {
    if (typeof window === 'undefined') return {};
    try {
        const STORAGE_KEY_PROGRESS = `crisprflix_progress_${movieId}`;
        const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading episode progress', error);
        return {};
    }
};

export const clearEpisodeProgress = (movieId) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`crisprflix_progress_${movieId}`);
    window.dispatchEvent(new Event('episodeProgressUpdated'));
};
