import React, { useEffect, useRef } from 'react';

function GalleryJournalSection() {
    const sectionRef = useRef(null); // Für scroll animation

    // IntersectionObserver für die "animate-up" Klasse
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    // Before/After Slider Logik
    useEffect(() => {
        document.querySelectorAll('.before-after-slider').forEach(slider => {
            const afterImage = slider.querySelector('.ba-image-after');
            const handle = slider.querySelector('.ba-slider-handle');
            let isDragging = false;

            const moveHandler = (x) => {
                const sliderRect = slider.getBoundingClientRect();
                let newX = x - sliderRect.left;
                if (newX < 0) newX = 0;
                if (newX > sliderRect.width) newX = sliderRect.width;
                let percentage = (newX / sliderRect.width) * 100;
                handle.style.left = `${percentage}%`;
                afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
            };

            const startDragging = (e) => {
                e.preventDefault();
                isDragging = true;
            };
            const stopDragging = () => {
                isDragging = false;
            };
            const onMouseMove = (e) => {
                if (isDragging) moveHandler(e.clientX);
            };
            const onTouchMove = (e) => {
                if (isDragging) moveHandler(e.touches[0].clientX);
            };

            slider.addEventListener('mousedown', startDragging);
            slider.addEventListener('touchstart', startDragging);
            window.addEventListener('mouseup', stopDragging);
            window.addEventListener('touchend', stopDragging);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchmove', onTouchMove);

            // Cleanup-Funktion
            return () => {
                slider.removeEventListener('mousedown', startDragging);
                slider.removeEventListener('touchstart', startDragging);
                window.removeEventListener('mouseup', stopDragging);
                window.removeEventListener('touchend', stopDragging);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('touchmove', onTouchMove);
            };
        });
    }, []); // Nur einmal beim Mount

    return (
        <section id="gallery-journal" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Inspiration</span>
                    <h2>Galerie & Journal</h2>
                    <p>Einblicke in meine Arbeit, Inspiration und Gedanken aus der Welt von IMW.</p>
                </div>
                <div className="gallery-grid">
                    <div className="animate-up" style={{ transitionDelay: '0.1s' }}>
                        <div className="before-after-slider interactive">
                            <div className="ba-image-container ba-image-before"><img src="https://images.pexels.com/photos/1805693/pexels-photo-1805693.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Vorher" /></div>
                            <div className="ba-image-container ba-image-after"><img src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Nachher" /></div>
                            <div className="ba-slider-handle"></div>
                        </div>
                    </div>
                    <a href="#" className="gallery-item interactive animate-up" style={{ transitionDelay: '0.2s' }}>
                        <div className="gallery-item-image">
                            <img src="https://images.pexels.com/photos/705255/pexels-photo-705255.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Präziser Bob-Schnitt" />
                            <div className="gallery-item-overlay">
                                <div className="overlay-content">
                                    <span className="category">Signature Cut</span>
                                    <h3>Der perfekte Bob</h3>
                                </div>
                            </div>
                        </div>
                    </a>
                    <a href="#" className="gallery-item interactive animate-up" style={{ transitionDelay: '0.3s' }}>
                        <div className="gallery-item-image">
                            <img src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Pflege-Tipps Journal" />
                            <div className="gallery-item-overlay">
                                <div className="overlay-content">
                                    <span className="category">Journal</span>
                                    <h3>5 Geheimnisse für gesundes Haar</h3>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </section>
    );
}

export default GalleryJournalSection;