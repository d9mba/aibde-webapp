import { getFullUrl, getYouTubeId } from '../utils';

interface MediaSectionProps {
    images: string[];
    videos: string[];
    selectedMedia: number;
    onSelectMedia: (index: number) => void;
}

export default function MediaSection({
    images,
    videos,
    selectedMedia,
    onSelectMedia,
}: MediaSectionProps) {
    const allMedia: { type: 'image' | 'video'; url: string; label: string }[] = [
        ...images.map((img, idx) => ({ type: 'image' as const, url: img, label: `Photo ${idx + 1}` })),
        ...videos.map((vid, idx) => ({ type: 'video' as const, url: vid, label: `Video ${idx + 1}` }))
    ];

    if (allMedia.length === 0) return null;

    const currentMedia = allMedia[selectedMedia] || allMedia[0];

    return (
        <section id="media" className="py-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4">Gallery</h2>

            {/* Main Display */}
            <div className="rounded-2xl overflow-hidden mb-4">
                {currentMedia?.type === 'image' ? (
                    <img
                        src={getFullUrl(currentMedia.url)}
                        alt={currentMedia.label}
                        className="w-full h-80 object-contain"
                    />
                ) : currentMedia?.type === 'video' ? (
                    (() => {
                        const ytId = getYouTubeId(currentMedia.url);
                        return ytId ? (
                            <div className="aspect-video">
                                <iframe
                                    src={`https://www.youtube.com/embed/${ytId}`}
                                    title={currentMedia.label}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        ) : (
                            <a
                                href={currentMedia.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-80 text-accent-blue hover:underline"
                            >
                                Open Video
                            </a>
                        );
                    })()
                ) : null}
            </div>

            {/* Thumbnail Previews */}
            {allMedia.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {allMedia.map((media, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelectMedia(idx)}
                            className={`relative overflow-hidden rounded-lg transition-all ${selectedMedia === idx ? 'ring-2 ring-accent-blue' : 'opacity-70 hover:opacity-100'
                                }`}
                            suppressHydrationWarning
                        >
                            {media.type === 'image' ? (
                                <img
                                    src={getFullUrl(media.url)}
                                    alt={media.label}
                                    className="w-20 h-14 object-cover"
                                />
                            ) : (
                                <div className="w-20 h-14 bg-bg-tertiary flex items-center justify-center">
                                    <svg className="w-6 h-6 text-accent-red" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
