import React, { useEffect, useRef } from 'react';

function AboutFounderSection() {
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
        <section id="about-founder" ref={sectionRef}>
            <div className="container founder-container">
                <div className="founder-image animate-up">
                    <img src="https://images.pexels.com/photos/3765114/pexels-photo-3765114.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Gründerin Julia Klein"></img>
                </div>
                <div className="founder-bio animate-up" style={{ transitionDelay: '0.1s' }}>
                    <span className="subtitle">Gründerin & Master Stylistin</span>
                    <h2>Julia Klein</h2>
                    <p className="philosophy">"Für mich ist Haarstyling die Kunst, die innere Schönheit einer Person sichtbar zu machen. Es geht nicht darum, Trends zu folgen, sondern darum, eine zeitlose Eleganz zu schaffen, die mühelos und authentisch ist."</p>
                    <p>Mit über 10 Jahren Erfahrung als zertifizierte L'Oréal Master Coloristin habe ich IMW als einen persönlichen Rückzugsort gegründet. Einen Ort, an dem Handwerkskunst, Ästhetik und Ihr Wohlbefinden im Mittelpunkt stehen. Ich spezialisiere mich auf natürliche Farbverläufe und präzise Haarschnitte, die mit Ihnen und Ihrem Lebensstil wachsen.</p>
                    <a href="#services" className="button-link interactive">Meine Services entdecken</a>
                </div>
            </div>
        </section>
    );
}

export default AboutFounderSection;
