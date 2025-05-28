import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api.service'; // API Service importieren
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Für Lade-Icon
import { faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'; // Für Lade-Icon
import "./LocationSection.css";

const germanDaysShort = {
    MONDAY: "Mo",
    TUESDAY: "Di",
    WEDNESDAY: "Mi",
    THURSDAY: "Do",
    FRIDAY: "Fr",
    SATURDAY: "Sa",
    SUNDAY: "So"
};

// Hilfsfunktion, um die Tage in der korrekten Reihenfolge (Mo-So) zu bekommen
const getOrderedDays = () => {
    return ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
};


function LocationSection({ openBookingModal }) {
    const sectionRef = useRef(null);
    const [workingHours, setWorkingHours] = useState([]);
    const [loadingHours, setLoadingHours] = useState(true);
    const [errorHours, setErrorHours] = useState(null);

    const fetchWorkingHours = useCallback(async () => {
        setLoadingHours(true);
        setErrorHours(null);
        try {
            const response = await api.get('/workinghours');
            // Sortiere die Daten nach der Reihenfolge der Wochentage
            const orderedDays = getOrderedDays();
            const sortedHours = (response.data || []).sort((a, b) => {
                return orderedDays.indexOf(a.dayOfWeek) - orderedDays.indexOf(b.dayOfWeek);
            });
            setWorkingHours(sortedHours);
        } catch (err) {
            console.error("Fehler beim Laden der Öffnungszeiten für LocationSection:", err);
            setErrorHours("Öffnungszeiten konnten nicht geladen werden.");
        } finally {
            setLoadingHours(false);
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        let currentSectionRef = sectionRef.current;

        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }

        fetchWorkingHours(); // Lade Öffnungszeiten beim Mounten

        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, [fetchWorkingHours]);


    return (
        <section id="location" ref={sectionRef}>
            <div className="container location-container">
                <div className="address-info animate-up">
                    <h3>Besuchen Sie mich</h3>
                    <p>Mein Salon ist ein bewusst gestalteter Rückzugsort im Herzen der Stadt. Ich freue mich darauf, Sie willkommen zu heißen.</p>
                    <p className="location-address">
                        Musterstraße 123<br />10115 Berlin, Deutschland
                    </p>

                    <h4>Öffnungszeiten:</h4>
                    {loadingHours && <p><FontAwesomeIcon icon={faSpinner} spin /> Lade Öffnungszeiten...</p>}
                    {errorHours && <p className="form-message error small"><FontAwesomeIcon icon={faExclamationCircle} /> {errorHours}</p>}
                    {!loadingHours && !errorHours && workingHours.length > 0 && (
                        <ul className="opening-hours-list">
                            {workingHours.map(wh => (
                                <li key={wh.dayOfWeek}>
                                    <span className="day-name">{germanDaysShort[wh.dayOfWeek]}:</span>
                                    {wh.isClosed || !wh.startTime || !wh.endTime ? (
                                        <span className="time-range closed">Geschlossen</span>
                                    ) : (
                                        <span className="time-range">{wh.startTime} - {wh.endTime} Uhr</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {!loadingHours && !errorHours && workingHours.length === 0 && (
                        <p>Öffnungszeiten sind derzeit nicht verfügbar.</p>
                    )}

                    <a href="#" className="button-link interactive mt-4" id="open-modal-btn-location" onClick={(e) => { e.preventDefault(); openBookingModal(); }}>Termin vereinbaren</a>
                </div>
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