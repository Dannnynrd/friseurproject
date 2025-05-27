import React, { useEffect, useRef } from 'react';
import './ExperienceSection.css'; // HIER den Import hinzufügen

function ExperienceSection() {
    // ... (Rest der Komponente bleibt gleich) ...
    const sectionRef = useRef(null);

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

    return (
        <section id="experience" ref={sectionRef}>
            <div className="container">
                {/* section-header wird global in App.css gestyled, oder könnte hier spezifisch werden */}
                <div className="section-header animate-up">
                    <span className="subtitle">Mein Versprechen</span>
                    <h2>Die Erfahrung</h2>
                    <p>Ein Besuch bei IMW ist mehr als ein Termin. Es ist ein Ritual, das der Ruhe und Ihrer individuellen Schönheit gewidmet ist.</p>
                </div>
                <div className="experience-grid">
                    <div className="experience-step animate-up" style={{ transitionDelay: '0.1s' }}>
                        <span className="step-number">01</span>
                        <h3>Ankommen</h3>
                        <p>Beginnen Sie Ihre Auszeit mit einem Getränk Ihrer Wahl in meiner ruhigen, minimalistischen Atmosphäre.</p>
                    </div>
                    <div className="experience-step animate-up" style={{ transitionDelay: '0.2s' }}>
                        <span className="step-number">02</span>
                        <h3>Beratung</h3>
                        <p>In einem persönlichen Gespräch analysiere ich Ihre Haarstruktur und Wünsche, um die perfekte Behandlung zu definieren.</p>
                    </div>
                    <div className="experience-step animate-up" style={{ transitionDelay: '0.3s' }}>
                        <span className="step-number">03</span>
                        <h3>Vollendung</h3>
                        <p>Genießen Sie das Ergebnis und erhalten Sie wertvolle Tipps, um Ihren neuen Look auch zu Hause perfekt zu pflegen.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ExperienceSection;