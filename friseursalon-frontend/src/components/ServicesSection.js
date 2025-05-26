import React, { useEffect, useRef } from 'react';
import ServiceForm from './ServiceForm'; // HIER FEHLTE DER IMPORT
import ServiceList from './ServiceList';   // HIER FEHLTE DER IMPORT

function ServicesSection({ currentUser, onServiceAdded, refreshServicesList, openBookingModal }) {
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
        <section id="services-dynamic" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Meine Expertise</span>
                    <h2>Services & Preise</h2>
                    <p>Ich biete eine kuratierte Auswahl an Dienstleistungen, die auf Präzision, Qualität und Nachhaltigkeit ausgelegt sind. Alle Preise sind Richtwerte und können je nach Aufwand variieren.</p>
                </div>

                {/* HIER WIRD DIE SERVICE LIST UND DAS SERVICE FORM KOMPONENTE GERENDERT */}
                {currentUser && (
                    <>
                        <h3>Dienstleistungsverwaltung (Admin)</h3>
                        <ServiceForm onServiceAdded={onServiceAdded} />
                        <hr />
                        <h3>Alle Dienstleistungen (Bearbeitbar)</h3>
                        <ServiceList key={refreshServicesList} />
                    </>
                )}

                {/* Wenn nicht eingeloggt, zeige statische Services (oder nur die Liste ohne Bearbeitung) */}
                {!currentUser && (
                    <div className="services-container animate-up">
                        <div className="service-category">
                            <h3>Schnitt & Styling</h3>
                            <div className="service-item">
                                <div className="service-info"><h4>Signature Cut</h4><p>Inklusive Beratung, Wäsche, Schnitt und Styling.</p></div>
                                <div className="service-action"><span className="price">ab 90 €</span><a href="#" className="book-service-btn interactive" data-service="Signature Cut" onClick={(e) => { e.preventDefault(); openBookingModal('Signature Cut'); }}>Termin anfragen</a></div>
                            </div>
                            <div className="service-item">
                                <div className="service-info"><h4>Wash & Blow-Dry</h4><p>Professionelles Föhnen und Stylen für jeden Anlass.</p></div>
                                <div className="service-action"><span className="price">ab 55 €</span><a href="#" className="book-service-btn interactive" data-service="Wash & Blow-Dry" onClick={(e) => { e.preventDefault(); openBookingModal('Wash & Blow-Dry'); }}>Termin anfragen</a></div>
                            </div>
                        </div>
                        <div className="service-category">
                            <h3>Farbe</h3>
                            <div className="service-item">
                                <div className="service-info"><h4>Balayage / Ombré</h4><p>Freihandtechnik für natürliche, sonnengeküsste Effekte.</p></div>
                                <div className="service-action"><span className="price">ab 180 €</span><a href="#" className="book-service-btn interactive" data-service="Balayage / Ombré" onClick={(e) => { e.preventDefault(); openBookingModal('Balayage / Ombré'); }}>Termin anfragen</a></div>
                            </div>
                            <div className="service-item">
                                <div className="service-info"><h4>Globalfarbe / Tönung</h4><p>Ansatz oder komplette Färbung für eine satte, gleichmäßige Farbe.</p></div>
                                <div className="service-action"><span className="price">ab 80 €</span><a href="#" className="book-service-btn interactive" data-service="Globalfarbe / Tönung" onClick={(e) => { e.preventDefault(); openBookingModal('Globalfarbe / Tönung'); }}>Termin anfragen</a></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default ServicesSection;