import React, { useEffect, useRef } from 'react';
import ServiceForm from './ServiceForm'; 
import ServiceList from './ServiceList';   
import "./ServicesSection.css";
import api from '../services/api.service'; // Required for fetching services for all users
import SkeletonLoader from './common/SkeletonLoader'; // Import SkeletonLoader

function ServicesSection({ currentUser, onServiceAdded, refreshServicesList, openBookingModal }) {
    const sectionRef = useRef(null);
    const [servicesForPublicView, setServicesForPublicView] = useState([]);
    const [isLoadingPublicServices, setIsLoadingPublicServices] = useState(false); // Initial true if not admin
    const [publicServicesError, setPublicServicesError] = useState(null);

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

    useEffect(() => {
        // Fetch services for public view if no user is logged in (admin manages via ServiceList directly)
        if (!currentUser) {
            const fetchPublicServices = async () => {
                setIsLoadingPublicServices(true);
                setPublicServicesError(null);
                try {
                    const response = await api.get('/services');
                    // Group services by category for display if needed, or display flat
                    // For simplicity, we'll assume a flat list structure for now,
                    // or that ServiceList component can handle categorization.
                    // The current static HTML has categories, so we might need to adapt.
                    // Let's just set them flat, and the display can be adjusted.
                    setServicesForPublicView(response.data || []);
                } catch (error) {
                    console.error("Error fetching public services:", error);
                    setPublicServicesError("Dienstleistungen konnten nicht geladen werden.");
                } finally {
                    setIsLoadingPublicServices(false);
                }
            };
            fetchPublicServices();
        }
    }, [currentUser]); // Re-fetch if user logs out, for example

    // Helper to render services in categories for the public view
    const renderCategorizedServices = (services) => {
        // Simple categorization logic (can be improved or made data-driven)
        const categories = {
            'Schnitt & Styling': services.filter(s => s.name.toLowerCase().includes('cut') || s.name.toLowerCase().includes('blow-dry') || s.name.toLowerCase().includes('styling')),
            'Farbe': services.filter(s => s.name.toLowerCase().includes('balayage') || s.name.toLowerCase().includes('ombré') || s.name.toLowerCase().includes('farbe') || s.name.toLowerCase().includes('tönung')),
            'Pflege & Specials': services.filter(s => !s.name.toLowerCase().includes('cut') && !s.name.toLowerCase().includes('blow-dry') && !s.name.toLowerCase().includes('styling') && !s.name.toLowerCase().includes('balayage') && !s.name.toLowerCase().includes('ombré') && !s.name.toLowerCase().includes('farbe') && !s.name.toLowerCase().includes('tönung')),
        };

        return Object.entries(categories).map(([categoryName, categoryServices]) => {
            if (categoryServices.length === 0) return null;
            return (
                <div key={categoryName} className="service-category">
                    <h3>{categoryName}</h3>
                    {categoryServices.map(service => (
                        <div key={service.id} className="service-item">
                            <div className="service-info">
                                <h4>{service.name}</h4>
                                {service.description && <p>{service.description}</p>}
                            </div>
                            <div className="service-action">
                                <span className="price">
                                    {typeof service.price === 'number' ? `ab ${service.price.toFixed(2)} €` : 'Preis auf Anfrage'}
                                </span>
                                <button 
                                    className="book-service-btn interactive" 
                                    onClick={() => openBookingModal(service.name)}
                                >
                                    Termin anfragen
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }).filter(Boolean); // Remove null entries for empty categories
    };


    return (
        <section id="services-dynamic" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Meine Expertise</span>
                    <h2>Services & Preise</h2>
                    <p>Ich biete eine kuratierte Auswahl an Dienstleistungen, die auf Präzision, Qualität und Nachhaltigkeit ausgelegt sind. Alle Preise sind Richtwerte und können je nach Aufwand variieren.</p>
                </div>

                {currentUser && currentUser.roles?.includes("ROLE_ADMIN") && (
                    <div className="admin-services-management">
                        <h3>Dienstleistungsverwaltung (Admin)</h3>
                        <ServiceForm onServiceAdded={onServiceAdded} />
                        <hr className="my-4" />
                        {/* ServiceList for admin already handles its own loading and skeleton */}
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                )}
                
                {!currentUser && (
                    isLoadingPublicServices ? (
                        // Use the 'service-item' type for skeleton, assuming list-like display
                        <SkeletonLoader type="service-item" count={4} />
                    ) : publicServicesError ? (
                        <p className="form-message error text-center">{publicServicesError}</p>
                    ) : servicesForPublicView.length > 0 ? (
                        <div className="services-container animate-up">
                           {renderCategorizedServices(servicesForPublicView)}
                        </div>
                    ) : (
                        <p className="text-center text-gray-600 py-4">Aktuell sind keine Dienstleistungen online verfügbar.</p>
                    )
                )}
                 {/* If admin is logged in, they see the ServiceList component which has its own skeleton logic.
                     If no user is logged in, we now fetch and display services with skeleton loader.
                     If a non-admin user is logged in, they should also see the public list.
                   */}
                {currentUser && !currentUser.roles?.includes("ROLE_ADMIN") && (
                     isLoadingPublicServices ? (
                        <SkeletonLoader type="service-item" count={4} />
                    ) : publicServicesError ? (
                        <p className="form-message error text-center">{publicServicesError}</p>
                    ) : servicesForPublicView.length > 0 ? (
                        <div className="services-container animate-up">
                           {renderCategorizedServices(servicesForPublicView)}
                        </div>
                    ) : (
                        <p className="text-center text-gray-600 py-4">Aktuell sind keine Dienstleistungen online verfügbar.</p>
                    )
                )}


            </div>
        </section>
    );
}

export default ServicesSection;