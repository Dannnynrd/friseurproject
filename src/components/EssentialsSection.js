import React, { useEffect, useRef } from 'react';

function EssentialsSection() {
    const sectionRef = useRef(null);

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

    return (
        <section id="essentials" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Für Zuhause</span>
                    <h2>Meine Essentials</h2>
                    <p>Eine kuratierte Auswahl der Produkte, denen ich vertraue. Alle Produkte sind sulfatfrei, tierversuchsfrei und nachhaltig.</p>
                </div>
                <div className="essentials-grid">
                    <div className="product-card animate-up" style={{ transitionDelay: '0.1s' }}>
                        <div className="product-image"><img src="https://images.pexels.com/photos/7692257/pexels-photo-7692257.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Shampoo" /></div>
                        <h3>Hydrating Shampoo</h3>
                        <p className="price">32,00 €</p>
                        <a href="#" className="interactive">Mehr erfahren</a>
                    </div>
                    <div className="product-card animate-up" style={{ transitionDelay: '0.2s' }}>
                        <div className="product-image"><img src="https://images.pexels.com/photos/7692233/pexels-photo-7692233.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Conditioner" /></div>
                        <h3>Repair Conditioner</h3>
                        <p className="price">34,00 €</p>
                        <a href="#" className="interactive">Mehr erfahren</a>
                    </div>
                    <div className="product-card animate-up" style={{ transitionDelay: '0.3s' }}>
                        <div className="product-image"><img src="https://images.pexels.com/photos/6621472/pexels-photo-6621472.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Haaröl" /></div>
                        <h3>Nourishing Oil</h3>
                        <p className="price">45,00 €</p>
                        <a href="#" className="interactive">Mehr erfahren</a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default EssentialsSection;