'use client';

import React, { useState, useEffect, useRef } from 'react';
import Nav from '../../components/Nav';
import { VolumeX, Play, MapPin, X, Clock, ChevronRight, Flag } from 'lucide-react';
import f1Servers from '../../f1.json';

const COUNTRY_TO_CODE = {
    'Bahrain': 'bh', 'Saudi Arabia': 'sa', 'Australia': 'au', 'Japan': 'jp',
    'China': 'cn', 'USA': 'us', 'United States': 'us', 'Italy': 'it',
    'Monaco': 'mc', 'Canada': 'ca', 'Spain': 'es', 'Austria': 'at',
    'UK': 'gb', 'United Kingdom': 'gb', 'Hungary': 'hu', 'Belgium': 'be',
    'Netherlands': 'nl', 'Singapore': 'sg', 'Azerbaijan': 'az', 'Mexico': 'mx',
    'Brazil': 'br', 'Qatar': 'qa', 'UAE': 'ae', 'Abu Dhabi': 'ae',
    'Las Vegas': 'us', 'Miami': 'us',
};

const FALLBACK_IMAGE = 'https://plus.unsplash.com/premium_photo-1664304747572-1e9730f17cc4?auto=format&fit=crop&q=80&w=800';

const CIRCUIT_IMAGES = {
    albert_park:   'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&q=80&w=800',
    shanghai:      'https://plus.unsplash.com/premium_photo-1675826460422-e39481fae224?auto=format&fit=crop&q=80&w=800',
    suzuka:        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
    bahrain:       'https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&q=80&w=800',
    jeddah:        'https://plus.unsplash.com/premium_photo-1697729655535-705aef824baf?auto=format&fit=crop&q=80&w=800',
    miami:         'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&q=80&w=800',
    imola:         'https://images.unsplash.com/photo-1534445867742-43195f401b6c?auto=format&fit=crop&q=80&w=800',
    monaco:        'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?auto=format&fit=crop&q=80&w=800',
    catalunya:     'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800',
    villeneuve:    'https://images.unsplash.com/photo-1519832979-6fa011b87667?auto=format&fit=crop&q=80&w=800',
    red_bull_ring: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=800',
    silverstone:   'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
    spa:           'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&q=80&w=800',
    hungaroring:   'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&q=80&w=800',
    zandvoort:     'https://images.unsplash.com/photo-1678719120909-1a0510d4e34a?auto=format&fit=crop&q=80&w=800',
    monza:         'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&q=80&w=800',
    baku:          'https://plus.unsplash.com/premium_photo-1661963188068-1bac46e28727?auto=format&fit=crop&q=80&w=800',
    marina_bay:    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=800',
    americas:      'https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&q=80&w=800',
    rodriguez:     'https://images.unsplash.com/photo-1518659526054-190340b32735?auto=format&fit=crop&q=80&w=800',
    interlagos:    'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800',
    vegas:         'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&q=80&w=800',
    losail:        'https://images.unsplash.com/photo-1572816703439-d8b34c4dc93f?auto=format&fit=crop&q=80&w=800',
    yas_marina:    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
    madring:       'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=800',
};

function FlagImg({ code, size = 40, className = '' }) {
    if (!code) return null;
    return (
        <img
            src={`https://flagcdn.com/w${size}/${code}.png`}
            alt=""
            className={className}
            onError={(e) => { e.target.style.display = 'none'; }}
        />
    );
}

export default function F1Page() {
    const serverNames = Object.keys(f1Servers);
    const [selectedServer, setSelectedServer] = useState(serverNames[0] || 'Server A');
    const [isPlaying, setIsPlaying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRace, setSelectedRace] = useState(null);
    const completedScrollRef = useRef(null);

    const streamUrl = f1Servers[selectedServer];

    useEffect(() => {
        async function fetchRaces() {
            try {
                const res = await fetch('https://api.jolpi.ca/ergast/f1/current.json?limit=30');
                const data = await res.json();
                setRaces(data.MRData.RaceTable.Races || []);
            } catch (error) {
                console.error('Failed to fetch F1 races', error);
            } finally {
                setLoading(false);
            }
        }
        fetchRaces();
    }, []);

    const getCircuitImage = (circuitId) => CIRCUIT_IMAGES[circuitId] || FALLBACK_IMAGE;

    const formatLocalTime = (date, time) => {
        if (!date || !time) return null;
        const dt = new Date(`${date}T${time}`);
        return {
            day: dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const getSchedule = (race) => {
        const sessions = [];
        if (race.FirstPractice) sessions.push({ name: 'Practice 1', ...formatLocalTime(race.FirstPractice.date, race.FirstPractice.time) });
        if (race.SecondPractice) sessions.push({ name: 'Practice 2', ...formatLocalTime(race.SecondPractice.date, race.SecondPractice.time) });
        if (race.ThirdPractice) sessions.push({ name: 'Practice 3', ...formatLocalTime(race.ThirdPractice.date, race.ThirdPractice.time) });
        if (race.SprintQualifying) sessions.push({ name: 'Sprint Quali', ...formatLocalTime(race.SprintQualifying.date, race.SprintQualifying.time) });
        if (race.Sprint) sessions.push({ name: 'Sprint Race', ...formatLocalTime(race.Sprint.date, race.Sprint.time) });
        if (race.Qualifying) sessions.push({ name: 'Qualifying', ...formatLocalTime(race.Qualifying.date, race.Qualifying.time) });
        if (race.date && race.time) sessions.push({ name: 'Race', ...formatLocalTime(race.date, race.time) });
        return sessions.filter(s => s.day && s.time);
    };

    const getCurrentWeekend = () => {
        const now = new Date();
        const day = now.getDay();
        const diffToFriday = day >= 5 ? day - 5 : day + 2;
        const friday = new Date(now);
        friday.setDate(friday.getDate() - diffToFriday);
        friday.setHours(0, 0, 0, 0);
        const sunday = new Date(friday);
        sunday.setDate(sunday.getDate() + 2);
        sunday.setHours(23, 59, 59, 999);
        return { friday, sunday };
    };

    const getRaceStatuses = (races) => {
        const now = new Date();
        const { friday, sunday } = getCurrentWeekend();
        let foundUpcoming = false;
        return races.map((race) => {
            const raceDate = new Date(`${race.date}T${race.time || '23:59:59Z'}`);
            if (raceDate >= friday && raceDate <= sunday) return 'live';
            if (raceDate < now) return 'completed';
            if (!foundUpcoming) { foundUpcoming = true; return 'upcoming'; }
            return 'future';
        });
    };

    const statuses = races.length > 0 ? getRaceStatuses(races) : [];

    const formatDate = (dateStr) => {
        return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', timeZone: 'UTC',
        });
    };

    const getCountryCode = (country) => COUNTRY_TO_CODE[country] || null;

    const liveRaceIndex = statuses.indexOf('live');
    const liveRace = liveRaceIndex !== -1 ? races[liveRaceIndex] : null;

    const completedRaces = races.filter((_, i) => statuses[i] === 'completed');
    const liveRaces = races.filter((_, i) => statuses[i] === 'live');
    const upcomingRaces = races.filter((_, i) => statuses[i] === 'upcoming');
    const futureRaces = races.filter((_, i) => statuses[i] === 'future');

    const selectedRaceStatus = selectedRace ? statuses[races.indexOf(selectedRace)] : null;

    // --- Race card component ---
    const RaceCard = ({ race, status, className = '' }) => {
        const code = getCountryCode(race.Circuit.Location.country);
        const image = getCircuitImage(race.Circuit.circuitId);

        const borderColor = {
            live: 'border-[#E50914]/60 hover:border-[#E50914]',
            upcoming: 'border-amber-500/40 hover:border-amber-500/70',
            completed: 'border-white/[0.06] hover:border-white/20',
            future: 'border-white/[0.06] hover:border-white/20',
        }[status];

        const badgeStyle = {
            live: 'bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40',
            upcoming: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            completed: 'bg-white/[0.06] text-white/50 border-white/[0.08]',
            future: 'bg-white/[0.06] text-white/40 border-white/[0.08]',
        }[status];

        const badgeText = {
            live: 'Live',
            upcoming: 'Next Up',
            completed: 'Completed',
            future: formatDate(race.date),
        }[status];

        return (
            <div
                onClick={() => setSelectedRace(race)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 border ${borderColor} ${className}`}
                style={status === 'live' ? { boxShadow: '0 0 40px rgba(229,9,20,0.12)' } : undefined}
            >
                {/* Background image */}
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    style={{ opacity: status === 'completed' ? 0.25 : 0.4 }}
                />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                {/* Accent top line */}
                {(status === 'live' || status === 'upcoming') && (
                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${status === 'live' ? 'bg-[#E50914]' : 'bg-amber-500'}`} />
                )}

                {/* Content */}
                <div className="relative h-full p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {code && (
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                                    <img
                                        src={`https://flagcdn.com/w80/${code}.png`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <span className="text-white/30 text-sm font-bold">R{race.round}</span>
                        </div>
                        <span className={`flex items-center gap-1.5 border text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeStyle}`}>
                            {status === 'live' && <span className="w-1.5 h-1.5 bg-[#E50914] rounded-full animate-pulse" />}
                            {badgeText}
                        </span>
                    </div>

                    <div>
                        <h4 className="text-white font-black text-xl leading-tight tracking-tight">
                            {race.raceName.replace(' Grand Prix', ' GP')}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
                            <MapPin className="w-3 h-3" />
                            <span>{race.Circuit.Location.locality}</span>
                            <span className="text-white/20">|</span>
                            <span>{formatDate(race.date)}</span>
                        </div>
                    </div>
                </div>

                {/* Hover arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="w-5 h-5 text-white/40" />
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen bg-[#0a0a0a] text-white">
            <Nav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            {/* Player Overlay */}
            {isPlaying && (
                <div
                    className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
                    onClick={() => setIsPlaying(false)}
                >
                    <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-6 right-6 z-[70] text-white/60 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div
                        className="w-full max-w-6xl aspect-video relative shadow-2xl overflow-hidden bg-black rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            id="frame"
                            className="embed-responsive-item w-full h-full"
                            frameBorder="0"
                            src={streamUrl}
                            allowFullScreen
                            scrolling="no"
                            allowtransparency="true"
                        />
                        <div className="absolute top-4 left-4 z-50">
                            <select
                                value={selectedServer}
                                onChange={(e) => setSelectedServer(e.target.value)}
                                className="bg-black/70 text-white text-xs border border-white/20 rounded-lg px-3 py-1.5 outline-none focus:border-[#E50914] backdrop-blur-sm"
                            >
                                {serverNames.map((server) => (
                                    <option key={server} value={server}>{server}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {selectedRace && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedRace(null)}
                >
                    <div
                        className="bg-[#161616] rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.8)] border border-white/[0.06]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'modalIn 0.25s ease-out' }}
                    >
                        {/* Modal hero */}
                        <div className="relative h-44 overflow-hidden">
                            <img
                                src={getCircuitImage(selectedRace.Circuit.circuitId)}
                                alt=""
                                className="w-full h-full object-cover"
                                style={{ opacity: 0.5 }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#161616]/50 to-transparent" />

                            {/* Accent line */}
                            {selectedRaceStatus === 'live' && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E50914]" />
                            )}
                            {selectedRaceStatus === 'upcoming' && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
                            )}

                            <button
                                onClick={() => setSelectedRace(null)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="absolute bottom-4 left-5 right-5">
                                <div className="flex items-center gap-2.5 mb-2">
                                    {getCountryCode(selectedRace.Circuit.Location.country) && (
                                        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                                            <img
                                                src={`https://flagcdn.com/w80/${getCountryCode(selectedRace.Circuit.Location.country)}.png`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Round {selectedRace.round}</span>
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{selectedRace.raceName}</h3>
                                <div className="flex items-center gap-1.5 mt-1.5 text-white/40 text-xs">
                                    <MapPin className="w-3 h-3" />
                                    <span>{selectedRace.Circuit.circuitName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="px-5 pt-4 pb-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">Your Local Time</span>
                            </div>

                            <div className="space-y-1">
                                {getSchedule(selectedRace).map((session, i) => {
                                    const isRace = session.name === 'Race';
                                    const isSprint = session.name === 'Sprint Race';
                                    return (
                                        <div
                                            key={session.name}
                                            className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                                                isRace ? 'bg-[#E50914]/10 border border-[#E50914]/20' :
                                                isSprint ? 'bg-amber-500/[0.06] border border-amber-500/10' :
                                                'bg-white/[0.03]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isRace && <Flag className="w-3.5 h-3.5 text-[#E50914]" />}
                                                <span className={`font-semibold text-sm ${
                                                    isRace ? 'text-[#E50914]' :
                                                    isSprint ? 'text-amber-400' :
                                                    'text-white/60'
                                                }`}>
                                                    {session.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-mono font-medium ${isRace ? 'text-white' : 'text-white/80'}`}>
                                                    {session.time}
                                                </span>
                                                <span className="text-white/25 text-xs min-w-[80px] text-right">{session.day}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedRaceStatus === 'live' && (
                                <button
                                    onClick={() => { setSelectedRace(null); setIsPlaying(true); }}
                                    className="mt-5 w-full flex items-center justify-center gap-2.5 bg-[#E50914] hover:bg-[#ff1a25] text-white font-bold rounded-xl py-3.5 transition-all hover:shadow-[0_0_30px_rgba(229,9,20,0.3)]"
                                >
                                    <Play className="w-4 h-4 fill-white" />
                                    Watch Live
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Page header */}
            <div className="pt-20 px-6 md:px-12 lg:px-16 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Formula 1</h1>
                        <span className="text-white/20 text-lg font-light">{new Date().getFullYear()} Season</span>
                    </div>
                </div>
            </div>

            {/* Race Calendar */}
            <div className="px-6 md:px-12 lg:px-16 py-10">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#E50914]/30 border-t-[#E50914]" />
                    </div>
                ) : (
                    <div className="space-y-12">

                        {/* Completed Races */}
                        {completedRaces.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-1 h-5 rounded-full bg-white/20" />
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-white/40 uppercase">Completed</h3>
                                    <span className="text-white/15 text-xs font-medium">{completedRaces.length} races</span>
                                </div>
                                <div ref={completedScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                                    {completedRaces.map((race) => (
                                        <RaceCard key={race.round} race={race} status="completed" className="h-48 min-w-[300px] flex-shrink-0" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Race Card */}
                        {liveRaces.map((race) => (
                            <div key={race.round}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-1 h-5 rounded-full bg-[#E50914]" />
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-white/40 uppercase">This Weekend</h3>
                                </div>
                                <RaceCard race={race} status="live" className="h-56 max-w-2xl" />
                            </div>
                        ))}

                        {/* Upcoming + Future Races */}
                        {(upcomingRaces.length > 0 || futureRaces.length > 0) && (
                            <div>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-1 h-5 rounded-full bg-amber-500/60" />
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-white/40 uppercase">Upcoming</h3>
                                    <span className="text-white/15 text-xs font-medium">{upcomingRaces.length + futureRaces.length} races</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {upcomingRaces.map((race) => (
                                        <RaceCard key={race.round} race={race} status="upcoming" className="h-52" />
                                    ))}
                                    {futureRaces.map((race) => (
                                        <RaceCard key={race.round} race={race} status="future" className="h-52" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal animation keyframes */}
            <style jsx global>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
