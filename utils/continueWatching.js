const STORAGE_KEY = 'crisprflix_continue_watching';
const MAX_ITEMS = 20;
const FINISHED_THRESHOLD = 90;

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

export const addToContinueWatching = (movie, season = null, episode = null, server = null) => {
    if (typeof window === 'undefined' || !movie) return;

    try {
        const progressData = getEpisodeProgress(movie.id);
        const progressKey = (season !== null && episode !== null) ? `s${season}e${episode}` : 'movie';
        
        if (progressData[progressKey] >= FINISHED_THRESHOLD) {
            return; // Don't add to continue watching if already finished
        }

        const currentList = getContinueWatching();
        const alreadyInList = currentList.find(item => item.id.toString() === movie.id.toString());
        const hasProgress = Object.values(progressData).some(p => p > 0);

        // Only add if it's already in the list (updating) OR if there is some progress
        if (!alreadyInList && !hasProgress) {
            return;
        }

        // Remove the movie if it already exists (to move it to the front)
        const filteredList = currentList.filter(item => item.id.toString() !== movie.id.toString());
        
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
    if (typeof window === 'undefined' || !movieId) return;

    try {
        const currentList = getContinueWatching();
        const newList = currentList.filter(item => item.id.toString() !== movieId.toString());
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
        
        const isTV = season !== null && episode !== null;
        const key = isTV ? `s${season}e${episode}` : 'movie';
        progressData[key] = progress;
        
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressData));
        window.dispatchEvent(new Event('episodeProgressUpdated'));

        // If progress is over threshold, remove from Continue Watching list
        if (progress >= FINISHED_THRESHOLD) {
            removeFromContinueWatching(movieId);
        }
    } catch (error) {
        console.error('Error updating episode progress', error);
    }
};

export const clearEpisodeProgress = (movieId) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`crisprflix_progress_${movieId}`);
    window.dispatchEvent(new Event('episodeProgressUpdated'));
};
