// src/components/TrustBarSection.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './TrustBarSection.module.css';
import { FiAward, FiScissors, FiHeart, FiSmile } from 'react-icons/fi';

const trustElements = [
    { icon: <FiAward size={26} />, title: 'Zertifizierte Qualität', text: 'Wir setzen auf preisgekrönte Produkte und höchste Standards für Ihr Haar.' },
    { icon: <FiScissors size={26} />, title: 'Meisterhaftes Handwerk', text: 'Jeder Schnitt ist ein Kunstwerk, präzise auf Ihren Typ zugeschnitten.' },
    { icon: <FiHeart size={26} />, title: 'Passionierte Pflege', text: 'Ihr Wohlbefinden und die Gesundheit Ihres Haares stehen an erster Stelle.' },
    { icon: <FiSmile size={26} />, title: 'Ihre Zufriedenheit', text: 'Unser größtes Ziel ist es, Sie mit einem Lächeln zu verabschieden.' },
];

const CARD_WIDTH_PERCENT = 85;
const GAP_PERCENT = 4;

function TrustBarSection() {
    const sectionRef = useRef(null);
    const [isSectionVisible, setIsSectionVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);
    const interactionTimeoutRef = useRef(null);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsSectionVisible(true);
                observer.unobserve(entries[0].target);
            }
        }, { threshold: 0.1 });
        const currentRef = sectionRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % trustElements.length);
    }, []);

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + trustElements.length) % trustElements.length);
    }, []);

    useEffect(() => {
        if (isInteracting || !isSectionVisible) return;
        const autoPlayInterval = setInterval(goToNext, 5000);
        return () => clearInterval(autoPlayInterval);
    }, [isInteracting, isSectionVisible, goToNext]);

    const handleInteraction = useCallback(() => {
        setIsInteracting(true);
        clearTimeout(interactionTimeoutRef.current);
        interactionTimeoutRef.current = setTimeout(() => {
            setIsInteracting(false);
        }, 5000);
    }, []);

    const handleTouchStart = (e) => {
        handleInteraction();
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current - touchEndX.current > 50) {
            goToNext();
        } else if (touchStartX.current - touchEndX.current < -50) {
            goToPrev();
        }
    };

    const getTrackTransform = () => {
        const offsetToCenter = (100 - CARD_WIDTH_PERCENT) / 2;
        const totalCardAndGap = CARD_WIDTH_PERCENT + GAP_PERCENT;
        return `translateX(calc(${offsetToCenter}% - ${currentIndex * totalCardAndGap}%))`;
    };

    return (
        <section
            id="trust-bar"
            ref={sectionRef}
            className={`${styles.trustSection} ${isSectionVisible ? styles.visible : ''}`}
        >
            <div className={styles.container}>
                <header className={styles.sectionHeader}>
                    <p className={styles.subtitle}>Unser Versprechen</p>
                    <h2 className={styles.title}>Eleganz in jedem Detail.</h2>
                </header>

                <div
                    className={styles.sliderContainer}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseEnter={handleInteraction}
                >
                    <div className={styles.sliderTrack} style={{ transform: getTrackTransform() }}>
                        {trustElements.map((element, index) => (
                            <div key={index} className={`${styles.trustElement} ${currentIndex === index ? styles.isActive : ''}`}>
                                <div className={styles.iconWrapper}>
                                    {element.icon}
                                </div>
                                <h3 className={styles.elementTitle}>{element.title}</h3>
                                <p className={styles.elementText}>{element.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TrustBarSection;