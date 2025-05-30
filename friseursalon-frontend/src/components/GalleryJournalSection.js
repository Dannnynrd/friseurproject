// friseursalon-frontend/src/components/GalleryJournalSection.js
import React, { useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './GalleryJournalSection.module.css';

function GalleryJournalSection() {
    const sectionRef = useRef(null); // Für Scroll-Animation
    // Refs für die Before/After Slider, falls mehrere vorhanden sind oder für gezielte Auswahl
    const beforeAfterSliderRef = useRef(null);

    // IntersectionObserver für die "animate-up" Klasse
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }

        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, []);

    // Before/After Slider Logik
    useEffect(() => {
        // Wir verwenden hier eine spezifischere Auswahl über die Ref, falls nur ein Slider vorhanden ist
        // oder passen den Selektor an, falls .beforeAfterSlider eine globale Klasse bleiben soll
        // Für CSS-Module ist es besser, mit Refs zu arbeiten oder die generierten Klassennamen zu verwenden.
        // Hier gehen wir davon aus, dass es pro Instanz dieser Komponente einen Slider gibt,
        // oder wir müssen die Logik anpassen, wenn mehrere Slider dynamisch gerendert werden.

        const slider = beforeAfterSliderRef.current;
        if (!slider) return;

        const afterImage = slider.querySelector(`.${styles.baImageAfter}`); // Modulklasse verwenden
        const handle = slider.querySelector(`.${styles.baSliderHandle}`);   // Modulklasse verwenden

        if (!afterImage || !handle) return;

        let isDragging = false;

        const moveHandler = (x) => {
            const sliderRect = slider.getBoundingClientRect();
            let newX = x - sliderRect.left;
            if (newX < 0) newX = 0;
            if (newX > sliderRect.width) newX = sliderRect.width;
            let percentage = (newX / sliderRect.width) * 100;
            handle.style.left = `${percentage}%`;
            // Wichtig: clip-path wird für das .baImageAfter Element gesetzt
            afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
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
            if (isDragging && e.touches[0]) moveHandler(e.touches[0].clientX);
        };

        // Event Listener am Slider-Element selbst anbringen
        slider.addEventListener('mousedown', startDragging);
        slider.addEventListener('touchstart', startDragging, { passive: false }); // passive: false, um preventDefault zu erlauben

        // Listener am Window für das Ende des Dragging und die Bewegung
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false }); // passive: false, um preventDefault zu erlauben

        return () => {
            slider.removeEventListener('mousedown', startDragging);
            slider.removeEventListener('touchstart', startDragging);
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [styles.baImageAfter, styles.baSliderHandle]); // Abhängigkeiten von den Modulklassen, falls sie sich ändern könnten (selten)

    return (
        <section id="gallery-journal" ref={sectionRef} className="py-16 md:py-24 bg-light-bg">
            <div className="container mx-auto px-6">
                {/* Section Header mit Tailwind Klassen */}
                <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 animate-up">
                    <span className="text-xs font-semibold text-medium-grey-text uppercase tracking-wider mb-1">
                        Inspiration
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-2">
                        Galerie & Journal
                    </h2>
                    <p className="text-base text-medium-grey-text">
                        Einblicke in meine Arbeit, Inspiration und Gedanken aus der Welt von IMW.
                    </p>
                </div>

                {/* Tailwind Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Before/After Slider */}
                    <div
                        className={`animate-up ${styles.beforeAfterSlider} aspect-[4/3] rounded-lg shadow-md relative overflow-hidden bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`}
                        style={{ transitionDelay: '0.1s' }}
                        ref={beforeAfterSliderRef} // Ref für den Slider
                        tabIndex={0} // Macht es fokussierbar für a11y
                    >
                        <div className={`${styles.baImageContainer} ${styles.baImageBefore}`}>
                            <img src="https://images.pexels.com/photos/1805693/pexels-photo-1805693.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Vorher" className="block w-full h-full object-cover" />
                        </div>
                        <div className={`${styles.baImageContainer} ${styles.baImageAfter}`}>
                            <img src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Nachher" className="block w-full h-full object-cover" />
                        </div>
                        <div className={styles.baSliderHandle}></div>
                    </div>

                    {/* Gallery Item 1 */}
                    <a href="#" className={`block animate-up ${styles.galleryItem} group aspect-[4/3] rounded-lg shadow-md relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`} style={{ transitionDelay: '0.2s' }}>
                        <div className={`${styles.galleryItemImage} w-full h-full`}>
                            <img src="https://images.pexels.com/photos/705255/pexels-photo-705255.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Präziser Bob-Schnitt" className="block w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-focus-visible:scale-105" />
                        </div>
                        <div className={`absolute inset-0 p-4 md:p-6 flex flex-col justify-end text-white bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 ${styles.galleryItemOverlay}`}>
                            <div>
                                <span className="block text-xs uppercase tracking-wide opacity-80 mb-1">Signature Cut</span>
                                <h3 className="font-serif text-lg md:text-xl font-medium">Der perfekte Bob</h3>
                            </div>
                        </div>
                    </a>

                    {/* Gallery Item 2 */}
                    <a href="#" className={`block animate-up ${styles.galleryItem} group aspect-[4/3] rounded-lg shadow-md relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`} style={{ transitionDelay: '0.3s' }}>
                        <div className={`${styles.galleryItemImage} w-full h-full`}>
                            <img src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Pflege-Tipps Journal" className="block w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 group-focus-visible:scale-105" />
                        </div>
                        <div className={`absolute inset-0 p-4 md:p-6 flex flex-col justify-end text-white bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 ${styles.galleryItemOverlay}`}>
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

