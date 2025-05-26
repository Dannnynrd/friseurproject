import React, { useEffect, useRef } from 'react';

function FAQSection() {
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
        <section id="faq" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Fragen & Antworten</span>
                    <h2>Gut zu wissen</h2>
                </div>
                <div className="faq-container animate-up">
                    <details className="faq-item">
                        <summary className="interactive">Muss ich vorab einen Beratungstermin buchen?</summary>
                        <div className="faq-content"><p>Für umfangreiche Farbveränderungen wie Balayage empfehle ich einen kurzen, kostenlosen Beratungstermin. Für Haarschnitte ist die Beratung im Termin inbegriffen.</p></div>
                    </details>
                    <details className="faq-item">
                        <summary className="interactive">Was ist deine Stornierungsrichtlinie?</summary>
                        <div className="faq-content"><p>Ich bitte um eine Absage bis spätestens 24 Stunden vor dem Termin. Bei späteren Absagen oder Nichterscheinen behalte ich mir vor, eine Ausfallgebühr zu berechnen.</p></div>
                    </details>
                    <details className="faq-item">
                        <summary className="interactive">Welche Produkte verwendest du?</summary>
                        <div className="faq-content"><p>Ich verwende ausschließlich hochwertige, salon-exklusive Marken, die meinen Werten von Nachhaltigkeit und Performance entsprechen. Alle Produkte sind frei von Sulfaten, Parabenen und wurden nicht an Tieren getestet.</p></div>
                    </details>
                </div>
            </div>
        </section>
    );
}

export default FAQSection;
