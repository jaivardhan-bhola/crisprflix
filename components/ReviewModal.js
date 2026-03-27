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
                className="relative w-full max-w-3xl bg-surface rounded-2xl shadow-strong overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-surface-hover to-surface flex items-center justify-center text-text-muted font-bold uppercase overflow-hidden border border-white/10 shadow-soft">
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
                            <h3 className="text-text-primary font-bold text-lg leading-none mb-1">{review.author}</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex text-yellow-500 scale-90 -ml-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round((review.author_details?.rating || 0) / 2) ? 'fill-current' : 'opacity-20'}`} />
                                    ))}
                                </div>
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-fast group"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6 text-text-muted group-hover:text-white transition-fast" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto scrollbar-hide">
                    <div className="relative">
                        <Quote className="absolute -top-4 -left-4 w-10 h-10 text-white/5 -z-10" />
                        <div className="text-text-secondary text-lg leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                            {review.content}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-white/5 text-center">
                    <p className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Verified Review from TMDB</p>
                </div>
            </div>
        </div>
    );
}

export default ReviewModal;
