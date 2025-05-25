import React, { useEffect, useRef } from 'react';

function LocationSection({ openBookingModal }) {
    const sectionRef = useRef(null);
    // const mapDivRef = useRef(null); // mapDivRef wird jetzt nicht mehr benötigt, da wir div direkt rendern

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

    // Die Google Maps Platzhalter Logik wird jetzt direkt im JSX gerendert,
    // anstatt innerHTML zu verwenden. Dadurch wird das CSP-Problem behoben.
    // useEffect(() => {
    //     if (mapDivRef.current) {
    //         mapDivRef.current.innerHTML = '<div style="width:100%;height:100%;background:#e5e5e5;display:flex;align-items:center;justify-content:center;border-radius:12px;color:#aaa;font-family:var(--font-sans);">Karten-Platzhalter</div>';
    //     }
    // }, []);


    return (
        <section id="location" ref={sectionRef}>
            <div className="container location-container">
                <div className="address-info animate-up">
                    <h3>Besuchen Sie mich</h3>
                    <p>Mein Salon ist ein bewusst gestalteter Rückzugsort im Herzen der Stadt. Ich freuen uns darauf, Sie willkommen zu heißen.</p>
                    <p>Musterstraße 123<br />10115 Berlin, Deutschland</p>
                    <p>Di - Fr: 10:00 - 19:00<br />Sa: 09:00 - 16:00</p>
                    <a href="#" className="button-link interactive" id="open-modal-btn-2" onClick={(e) => { e.preventDefault(); openBookingModal(); }}>Termin vereinbaren</a>
                </div>
                {/* HIER IST DIE KORREKTUR: Direkter JSX-Render statt innerHTML */}
                <div id="map" className="animate-up" style={{ transitionDelay: '0.1s' }}>
                    <div style={{width:'100%',height:'100%',background:'#e5e5e5',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'12px',color:'#aaa',fontFamily:'var(--font-sans)'}}>
                        Karten-Platzhalter
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LocationSection;