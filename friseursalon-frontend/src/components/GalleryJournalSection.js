// friseursalon-frontend/src/components/GalleryJournalSection.js
import React, { useEffect, useRef } from 'react';
import styles from './GalleryJournalSection.module.css';

function GalleryJournalSection() {
    const sectionRef = useRef(null);
    const beforeAfterSliderRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) observer.observe(currentSectionRef);
        return () => { if (currentSectionRef) observer.unobserve(currentSectionRef); };
    }, []);

    useEffect(() => {
        const slider = beforeAfterSliderRef.current;
        if (!slider) return;

        const afterImage = slider.querySelector(`.${styles.baImageAfter}`);
        const handle = slider.querySelector(`.${styles.baSliderHandle}`);
        if (!afterImage || !handle) return;

        let isDragging = false;
        const moveHandler = (x) => {
            const sliderRect = slider.getBoundingClientRect();
            let newX = x - sliderRect.left;
            if (newX < 0) newX = 0;
            if (newX > sliderRect.width) newX = sliderRect.width;
            let percentage = (newX / sliderRect.width) * 100;
            handle.style.left = `${percentage}%`;
            afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        };

        const startDragging = (e) => { e.preventDefault(); isDragging = true; };
        const stopDragging = () => { isDragging = false; };
        const onMouseMove = (e) => { if (isDragging) moveHandler(e.clientX); };
        const onTouchMove = (e) => { if (isDragging && e.touches[0]) moveHandler(e.touches[0].clientX); };

        slider.addEventListener('mousedown', startDragging);
        slider.addEventListener('touchstart', startDragging, { passive: false });
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            slider.removeEventListener('mousedown', startDragging);
            slider.removeEventListener('touchstart', startDragging);
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [styles.baImageAfter, styles.baSliderHandle]);

    return (
        <section id="gallery-journal" ref={sectionRef} className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 animate-up">
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-4">
                        Galerie & Journal
                    </h2>
                    <p className="text-base text-medium-grey-text leading-relaxed">
                        Einblicke in unsere Arbeit und Inspirationen aus der Welt von IMW.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <div
                        className={`animate-up ${styles.beforeAfterSlider}`}
                        style={{ transitionDelay: '0.1s' }}
                        ref={beforeAfterSliderRef}
                        tabIndex={0}
                    >
                        <div className={`${styles.baImageContainer} ${styles.baImageBefore}`}>
                            <img src="https://images.pexels.com/photos/1805693/pexels-photo-1805693.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Vorher" className={styles.sliderImage} />
                        </div>
                        <div className={`${styles.baImageContainer} ${styles.baImageAfter}`}>
                            <img src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Nachher" className={styles.sliderImage} />
                        </div>
                        <div className={styles.baSliderHandle}></div>
                    </div>

                    <a href="# " className={`group ${styles.galleryItem}`} style={{ transitionDelay: '0.2s' }}>
                        <img src="https://images.pexels.com/photos/705255/pexels-photo-705255.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Präziser Bob-Schnitt" className={styles.galleryImage} />
                        <div className={styles.galleryItemOverlay}>
                            <div>
                                <span className="block text-xs uppercase tracking-wide opacity-80 mb-1">Signature Cut</span>
                                <h3 className="font-serif text-lg md:text-xl font-medium">Der perfekte Bob</h3>
                            </div>
                        </div>
                    </a>

                    <a href="# " className={`group ${styles.galleryItem}`} style={{ transitionDelay: '0.3s' }}>
                        <img src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Pflege-Tipps Journal" className={styles.galleryImage} />
                        <div className={styles.galleryItemOverlay}>
                            <div>
                                <span className="block text-xs uppercase tracking-wide opacity-80 mb-1">Journal</span>
                                <h3 className="font-serif text-lg md:text-xl font-medium">5 Geheimnisse für gesundes Haar</h3>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </section>
    );
}

export default GalleryJournalSection;