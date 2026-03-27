'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Nav from '../../../components/Nav';
import Skeleton from '../../../components/Skeleton';
import Footer from '../../../components/Footer';
import { Film, Tv, Star } from 'lucide-react';

export default function KeywordPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const id = params.id;
    const keywordName = searchParams.get('name') || 'Keyword';
    const initialType = searchParams.get('type') || 'movie';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState(initialType);
    
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
        async function fetchKeywordData() {
            setLoading(true);
            try {
                const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&with_keywords=${id}&language=en-US&sort_by=popularity.desc`;
                const res = await fetch(url);
                const data = await res.json();
                setResults(data.results || []);
            } catch (error) {
                console.error("Failed to fetch keyword data", error);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchKeywordData();
    }, [id, type]);

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
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-8 border-b border-white/10">
                            <div className="space-y-2">
                                <span className="text-netflix-red text-xs font-black uppercase tracking-[0.3em]">Keyword Category</span>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter capitalize drop-shadow-lg">{keywordName}</h1>
                            </div>

                            <div className="flex bg-surface/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md shadow-soft">
                                <button
                                    onClick={() => setType('movie')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all duration-300 ${type === 'movie' ? 'bg-netflix-red text-white shadow-strong' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                >
                                    <Film className="w-4 h-4" /> Movies
                                </button>
                                <button
                                    onClick={() => setType('tv')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all duration-300 ${type === 'tv' ? 'bg-netflix-red text-white shadow-strong' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                >
                                    <Tv className="w-4 h-4" /> TV Shows
                                </button>
                            </div>
                        </header>

                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                                {[...Array(10)].map((_, i) => <Skeleton key={i} className="aspect-[2/3] w-full" />)}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12">
                                {results.map((item) => (
                                    <div key={item.id} className="relative aspect-[2/3]">
                                        <div 
                                            onClick={() => router.push(`/${type}/${item.id}`)}
                                            className="group absolute inset-0 cursor-pointer transition-standard hover:scale-105 active:scale-95 z-10 hover:z-20"
                                        >
                                            <div className="w-full h-full overflow-hidden rounded-xl border-2 border-transparent group-hover:border-netflix-red transition-standard shadow-soft group-hover:shadow-strong mb-4 bg-surface relative">
                                                <img
                                                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500/${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-standard group-hover:brightness-50 group-hover:scale-105"
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
                                                    <p className="text-[10px] text-text-muted font-bold mt-1">
                                                        {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <p className="text-text-secondary text-xl font-medium">No results found for this category.</p>
                                <button 
                                    onClick={() => setType(type === 'movie' ? 'tv' : 'movie')}
                                    className="text-netflix-red font-bold uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-4 transition-fast"
                                >
                                    Switch to {type === 'movie' ? 'TV Shows' : 'Movies'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
            {!showResults && <Footer />}
        </div>
    );
}
