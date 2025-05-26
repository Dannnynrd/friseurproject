import React, { useEffect, useRef } from 'react';

function NewsletterSection() {
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
        <section id="newsletter" ref={sectionRef}>
            <div className="container animate-up">
                <h2>Bleiben Sie inspiriert</h2>
                <p>Abonnieren Sie meinen Newsletter für exklusive Einblicke, Styling-Tipps und besondere Angebote direkt in Ihr Postfach.</p>
                <form className="newsletter-form">
                    <input type="email" placeholder="Ihre E-Mail-Adresse" required />
                    <button type="submit" className="interactive">Abonnieren</button>
                </form>
            </div>
        </section>
    );
}

export default NewsletterSection;
