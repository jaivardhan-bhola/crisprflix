'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '../../../components/Nav';
import Row from '../../../components/Row';
import Skeleton from '../../../components/Skeleton';
import Footer from '../../../components/Footer';
import { Calendar, MapPin, Star, Film, ChevronDown, ChevronUp } from 'lucide-react';

export default function PersonDetails() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [person, setPerson] = useState(null);
    const [credits, setCredits] = useState([]);
    const [movieCredits, setMovieCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBioExpanded, setIsBioExpanded] = useState(false);

    // Search State (Unified)
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.length > 0) {
                setIsSearching(true);
                setShowResults(true);
                try {
                    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(searchQuery)}&page=1&include_adult=false`;
                    const res = await fetch(url);
                    const data = await res.json();
                    setSearchResults(data.results?.filter(m => m.poster_path || m.backdrop_path) || []);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setShowResults(false);
                setSearchResults([]);
            }
        };
        const timeoutId = setTimeout(handleSearch, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
        async function fetchPersonData() {
            setLoading(true);
            try {
                const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                const personRes = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=en-US`);
                const personData = await personRes.json();
                setPerson(personData);

                const combinedRes = await fetch(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`);
                const combinedData = await combinedRes.json();
                setCredits(combinedData.cast?.filter(item => item.poster_path || item.backdrop_path).sort((a, b) => b.popularity - a.popularity) || []);

                const movieRes = await fetch(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${API_KEY}&language=en-US`);
                const movieData = await movieRes.json();
                setMovieCredits(movieData.cast?.filter(item => item.poster_path || item.backdrop_path).sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0)) || []);
            } catch (error) {
                console.error("Failed to fetch person data", error);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchPersonData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-netflix-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-netflix-red rounded-full animate-spin" />
            </div>
        );
    }

    if (!person) return <div className="h-screen bg-netflix-black text-white flex items-center justify-center">Person not found.</div>;

    return (
        <div className="relative min-h-screen bg-netflix-black text-white selection:bg-netflix-red">
            <Nav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <main className="px-4 md:px-12 pt-32 pb-20 max-w-7xl mx-auto">
                {showResults ? (
                    <div className="min-h-screen animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                            {isSearching && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {isSearching ? (
                                [...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-[2/3] w-full" />)
                            ) : (
                                searchResults.map((result) => (
                                    <div
                                        key={result.id}
                                        onClick={() => router.push(`/${result.media_type || (result.name ? 'tv' : 'movie')}/${result.id}`)}
                                        className="group cursor-pointer transition-standard hover:scale-105"
                                    >
                                        <div className="aspect-[2/3] w-full overflow-hidden rounded-md shadow-soft group-hover:shadow-strong">
                                            <img
                                                className="w-full h-full object-cover transition-standard group-hover:brightness-110"
                                                src={`https://image.tmdb.org/t/p/w500/${result.poster_path || result.backdrop_path}`}
                                                alt=""
                                                loading="lazy"
                                            />
                                        </div>
                                        <p className="mt-3 text-sm font-medium text-text-secondary truncate group-hover:text-white transition-fast">
                                            {result.title || result.name}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                            {/* Profile Sidebar */}
                            <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/5 shadow-strong group">
                                    <img
                                        src={person.profile_path ? `https://image.tmdb.org/t/p/original/${person.profile_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                                        alt={person.name}
                                        className="w-full h-full object-cover transition-standard group-hover:scale-105"
                                    />
                                </div>
                                
                                <div className="space-y-6 bg-surface/30 p-6 rounded-2xl border border-white/5 shadow-soft">
                                    <h3 className="text-netflix-red text-[10px] font-black uppercase tracking-[0.2em] pb-4 border-b border-white/5">Personal Information</h3>
                                    
                                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5"><Star className="w-3 h-3" /> Known For</p>
                                            <p className="text-text-primary text-sm font-bold">{person.known_for_department}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Gender</p>
                                            <p className="text-text-primary text-sm font-bold">{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Non-binary'}</p>
                                        </div>
                                        
                                        {person.birthday && (
                                            <div className="space-y-1">
                                                <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Birthday</p>
                                                <p className="text-text-primary text-sm font-bold">{person.birthday}</p>
                                            </div>
                                        )}
                                        
                                        {person.place_of_birth && (
                                            <div className="space-y-1">
                                                <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Place of Birth</p>
                                                <p className="text-text-primary text-sm font-bold">{person.place_of_birth}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content */}
                            <section className="flex-grow min-w-0 space-y-12">
                                <header className="space-y-4">
                                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic drop-shadow-lg">{person.name}</h1>
                                </header>
                                
                                {person.biography && (
                                    <div className="space-y-4">
                                        <h3 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Biography</h3>
                                        <div className="relative group">
                                            <p className={`text-text-secondary leading-relaxed text-lg transition-all duration-500 ${!isBioExpanded ? 'line-clamp-6' : ''}`}>
                                                {person.biography}
                                            </p>
                                            {person.biography.length > 500 && (
                                                <button 
                                                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                                                    className="mt-4 text-netflix-red font-bold uppercase tracking-widest text-[10px] hover:underline decoration-2 underline-offset-4 transition-fast"
                                                >
                                                    {isBioExpanded ? 'Read Less' : 'Read Full Biography'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-12 pt-12 border-t border-white/5">
                                    <div className="space-y-6">
                                        <h3 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Known For</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                            {credits.slice(0, 10).map((item) => (
                                                <div 
                                                    key={item.id} 
                                                    className="relative aspect-[2/3]"
                                                >
                                                    <div 
                                                        onClick={() => router.push(`/${item.media_type || (item.name ? 'tv' : 'movie')}/${item.id}`)}
                                                        className="group absolute inset-0 cursor-pointer transition-standard hover:scale-105 active:scale-95 z-10 hover:z-30"
                                                    >
                                                        <div className="w-full h-full overflow-hidden rounded-xl border-2 border-transparent group-hover:border-netflix-red transition-standard shadow-soft group-hover:shadow-strong bg-surface relative">
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w342/${item.poster_path || item.backdrop_path}`}
                                                                alt=""
                                                                className="w-full h-full object-cover transition-standard group-hover:scale-105 group-hover:brightness-50"
                                                                loading="lazy"
                                                            />
                                                            
                                                            {/* Hover Overlay */}
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-standard p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <div className="flex items-center gap-1 bg-netflix-red text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-soft">
                                                                        <Star className="w-2.5 h-2.5 fill-current" />
                                                                        {item.vote_average?.toFixed(1)}
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                                                                    {item.title || item.name}
                                                                </h3>
                                                                {item.character && <p className="text-[10px] text-text-muted font-bold mt-1 line-clamp-1 italic">as {item.character}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-12 border-t border-white/5 -mx-4 md:-mx-12">
                                        <Row 
                                            title="Production Credits" 
                                            data={movieCredits} 
                                            onMovieClick={(m) => router.push(`/movie/${m.id}`)}
                                            isLargeRow={true}
                                            className="px-4 md:px-12"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>
            {!showResults && <Footer />}
        </div>
    );
}
