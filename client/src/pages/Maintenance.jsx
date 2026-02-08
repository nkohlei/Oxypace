import { useEffect, useState, useRef } from 'react';
import './Maintenance.css';

const Maintenance = () => {
    const audioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.play().catch((e) => console.log('Audio play failed', e));
            } else {
                audioRef.current.pause();
            }
            setIsMuted(!isMuted);
        }
    };

    // Auto-play attempt on mount
    useEffect(() => {
        const playAudio = async () => {
            if (audioRef.current) {
                try {
                    audioRef.current.volume = 1.0;
                    await audioRef.current.play();
                    setIsMuted(false);
                } catch (err) {
                    // Autoplay blocked
                    console.log('Autoplay blocked, waiting for user interaction');
                    setIsMuted(true);
                }
            }
        };
        playAudio();
    }, []);

    return (
        <div className="maintenance-container western-theme">
            {/* Background Audio */}
            <audio ref={audioRef} loop src="/assets/maintenance_audio.mp3" />

            {/* Audio Toggle Control */}
            <div className="audio-control" onClick={toggleAudio}>
                {isMuted ? '🔇 SESİ AÇ' : '🔊 SESİ KAPAT'}
            </div>

            {/* Moving Tumbleweeds */}
            <div className="tumbleweed"></div>
            <div className="tumbleweed two"></div>

            {/* Floating Elements (Gun, Hat, etc - simulated with divs) */}
            <div className="western-element gun"></div>
            <div className="western-element hat"></div>

            {/* Main Wanted Poster */}
            <div className="wanted-poster">
                <div className="poster-header">WANTED</div>

                <div className="poster-image-area">
                    {/* You can replace this src with a specific character image if needed */}
                    <img src="/assets/renovate.jpg" alt="Wanted" className="sepia-filter" />
                    <div className="poster-stamp">RENOVATION</div>
                </div>

                <div className="poster-content">
                    <h2 className="western-font">YENİLENİYORUZ</h2>
                    <p className="western-text">
                        "Daha sorunsuz ve daha mükemmel bir hizmet için."
                    </p>
                    <p className="western-subtext">Hizmette zahmet olmaz, geri geleceğiz.</p>
                </div>

                <div className="poster-footer">REWARD: BETTER EXPERIENCE</div>
            </div>
        </div>
    );
};

export default Maintenance;
