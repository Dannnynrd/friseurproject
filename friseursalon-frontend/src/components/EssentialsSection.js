// friseursalon-frontend/src/components/EssentialsSection.js
import React, { useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './EssentialsSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'; // Beispiel-Icon

function EssentialsSection() {
    const sectionRef = useRef(null);

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

    // Beispieldaten für Produkte/Essentials
    const essentials = [
        {
            id: 1,
            category: "Haarpflege",
            name: "Revitalisierendes Arganöl Shampoo",
            price: "28,00 €",
            imageUrl: "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=800",
            link: "#" // Link zur Produktseite oder zum Shop
        },
        {
            id: 2,
            category: "Styling",
            name: "Flexibles Textur-Spray",
            price: "22,50 €",
            imageUrl: "https://images.pexels.com/photos/7699763/pexels-photo-7699763.jpeg?auto=compress&cs=tinysrgb&w=800",
            link: "#"
        },
        {
            id: 3,
            category: "Pflege-Kur",
            name: "Intensive Keratin Haarmaske",
            price: "35,00 €",
            imageUrl: "https://images.pexels.com/photos/4046010/pexels-photo-4046010.jpeg?auto=compress&cs=tinysrgb&w=800",
            link: "#"
        }
    ];

    return (
        <section id="essentials" ref={sectionRef} className="py-16 md:py-24 bg-white"> {/* Hintergrund anpassen, falls nötig */}
            <div className="container mx-auto px-6">
                {/* Section Header mit Tailwind Klassen */}
                <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 animate-up">
                    <span className="text-xs font-semibold text-medium-grey-text uppercase tracking-wider mb-1">
                        Must-Haves
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-2">
                        Meine Produkt-Essentials
                    </h2>
                    <p className="text-base text-medium-grey-text">
                        Sorgfältig ausgewählte Produkte, die ich für die Pflege und das Styling zu Hause empfehle.
                    </p>
                </div>

                {/* Tailwind Grid für Produkte */}
                <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 ${styles.essentialsGrid}`}>
                    {essentials.map((item, index) => (
                        <div
                            key={item.id}
                            className={`animate-up group bg-light-bg rounded-lg shadow-md overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl ${styles.productCard}`}
                            style={{ transitionDelay: `${index * 0.1}s` }}
                        >
                            <a href={item.link} className="block overflow-hidden aspect-[3/2.5] relative"> {/* Link um das Bild und ggf. den Titel */}
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/600x500/e2e8f0/94a3b8?text=Produktbild";
                                    }}
                                />
                                {/* Optional: Overlay für schnellen Kauf-Button oder Details beim Hover */}
                                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    {/* <FontAwesomeIcon icon={faShoppingCart} className="text-white text-3xl" /> */}
                                </div>
                            </a>
                            <div className="p-5 md:p-6 flex flex-col flex-grow">
                                <span className={`block text-xs font-medium text-medium-grey-text uppercase tracking-wide mb-1 ${styles.productCategory}`}>
                                    {item.category}
                                </span>
                                <h3 className={`font-serif text-lg font-semibold text-dark-text mb-2 ${styles.productName}`}>
                                    <a href={item.link} className="hover:text-indigo-600 transition-colors duration-200">{item.name}</a>
                                </h3>
                                <p className={`text-base font-semibold text-indigo-600 mt-auto pt-2 ${styles.productPrice}`}> {/* mt-auto schiebt Preis nach unten */}
                                    {item.price}
                                </p>
                                {/* Optional: Button zum Warenkorb oder zur Detailseite */}
                                {/*
                                <a
                                    href={item.link}
                                    className="mt-4 inline-block bg-dark-text text-light-bg px-5 py-2.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors duration-200 text-center"
                                >
                                    Details ansehen
                                </a>
                                */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default EssentialsSection;
