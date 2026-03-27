'use client';

import React from 'react';
import { X, Star, Calendar, Quote } from 'lucide-react';

function ReviewModal({ review, onClose }) {
    if (!review) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-3xl bg-[#181818] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#181818] z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-zinc-400 font-bold uppercase overflow-hidden border border-zinc-700">
                            {review.author_details?.avatar_path ? (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w45${review.author_details.avatar_path}`} 
                                    alt={review.author} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                review.author[0]
                            )}
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg leading-none mb-1">{review.author}</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex text-yellow-500 scale-90 -ml-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round((review.author_details?.rating || 0) / 2) ? 'fill-current' : 'opacity-20'}`} />
                                    ))}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                    >
                        <X className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="relative">
                        <Quote className="absolute -top-4 -left-4 w-8 h-8 text-zinc-800 -z-10" />
                        <div className="text-zinc-300 text-lg leading-relaxed space-y-4 whitespace-pre-wrap font-medium italic">
                            {review.content}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Verified Review from TMDB</p>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
            `}</style>
        </div>
    );
}

export default ReviewModal;
