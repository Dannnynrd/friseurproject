import React from 'react';
import ServicesSection from '../components/ServicesSection';
import Footer from '../components/Footer'; // Importiere den Footer
import Header from '../components/Header'; // Importiere den Header (optional, wenn nicht in App.js)

// Diese Komponente dient als Wrapper für die ServicesSection, um alle Services anzuzeigen
const AllServicesPage = () => {
    return (
        <div className="all-services-page-container" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
            <ServicesSection />
        </div>
    );
};

export default AllServicesPage;