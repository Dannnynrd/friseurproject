// friseursalon-frontend/src/components/AdminTestimonialManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import testimonialService from '../services/testimonial.service'; // Annahme: testimonial.service.js existiert
// HIER den Import ändern:
import styles from './AdminTestimonialManagement.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faTrashAlt, faSpinner, faExclamationTriangle, faStar, faFilter, faUser } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal'; // Wiederverwendung

function AdminTestimonialManagement() {
    const [testimonials, setTestimonials] = useState([]);
    const [allTestimonials, setAllTestimonials] = useState([]); // Für Filterung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [filter, setFilter] = useState('ALL'); // 'ALL', 'APPROVED', 'PENDING'

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [testimonialToDelete, setTestimonialToDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Für Ladezustand einzelner Aktionen (approve/unapprove/delete)

    const fetchTestimonials = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            const response = await testimonialService.getAllTestimonials(); // Admin-Endpunkt
            const sortedTestimonials = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllTestimonials(sortedTestimonials);
            setTestimonials(sortedTestimonials); // Initial alle anzeigen
        } catch (err) {
            console.error("Error fetching testimonials:", err);
            setError(err.response?.data?.message || "Bewertungen konnten nicht geladen werden.");
            setAllTestimonials([]);
            setTestimonials([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    useEffect(() => {
        let filtered = [];
        if (filter === 'ALL') {
            filtered = allTestimonials;
        } else if (filter === 'APPROVED') {
            filtered = allTestimonials.filter(t => t.approved);
        } else if (filter === 'PENDING') {
            filtered = allTestimonials.filter(t => !t.approved);
        }
        setTestimonials(filtered);
    }, [filter, allTestimonials]);

    const handleApprove = async (id) => {
        setActionLoading(id); // Setze Ladezustand für diesen spezifischen Eintrag
        setError(null);
        setSuccessMessage('');
        try {
            await testimonialService.approveTestimonial(id);
            setSuccessMessage("Bewertung erfolgreich genehmigt.");
            // Optimistisches Update oder Neuladen
            setAllTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved: true } : t));
        } catch (err) {
            setError(err.response?.data?.message || "Fehler beim Genehmigen der Bewertung.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnapprove = async (id) => {
        setActionLoading(id);
        setError(null);
        setSuccessMessage('');
        try {
            await testimonialService.unapproveTestimonial(id);
            setSuccessMessage("Genehmigung der Bewertung zurückgenommen.");
            setAllTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved: false } : t));
        } catch (err) {
            setError(err.response?.data?.message || "Fehler beim Zurücknehmen der Genehmigung.");
        } finally {
            setActionLoading(null);
        }
    };

    const confirmDelete = (testimonialId) => {
        setTestimonialToDelete(testimonialId);
        setShowConfirmDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!testimonialToDelete) return;
        setActionLoading(testimonialToDelete); // Ladezustand für den zu löschenden Eintrag
        setError(null);
        setSuccessMessage('');
        try {
            await testimonialService.deleteTestimonial(testimonialToDelete);
            setSuccessMessage("Bewertung erfolgreich gelöscht.");
            fetchTestimonials(); // Komplette Liste neu laden
        } catch (err) {
            setError(err.response?.data?.message || "Fehler beim Löschen der Bewertung.");
        } finally {
            setShowConfirmDeleteModal(false);
            setTestimonialToDelete(null);
            setActionLoading(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={i <= rating ? "text-yellow-400" : "text-gray-300"}
                />
            );
        }
        return <div className="flex items-center">{stars}</div>;
    };


    if (loading && testimonials.length === 0) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Bewertungen...</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.testimonialManagementContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif">
                    Bewertungen verwalten
                </h2>
                {/* Filter Optionen */}
                <div className="mt-3 sm:mt-0">
                    <label htmlFor="filterTestimonials" className="sr-only">Filter</label>
                    <select
                        id="filterTestimonials"
                        name="filterTestimonials"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="ALL">Alle</option>
                        <option value="APPROVED">Genehmigt</option>
                        <option value="PENDING">Ausstehend</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className={`mb-4 p-3 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`mb-4 p-3 rounded-md bg-green-50 text-green-600 border border-green-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}

            {testimonials.length === 0 && !loading && !error && (
                <div className={`text-center py-8 px-6 bg-slate-50 rounded-lg ${styles.noTestimonials}`}>
                    <FontAwesomeIcon icon={faUser} size="2x" className="text-gray-400 mb-3" /> {/* faComments wäre auch passend */}
                    <p className="text-gray-500 text-md">
                        {filter === 'ALL' ? "Es sind keine Bewertungen vorhanden." : `Keine ${filter === 'APPROVED' ? 'genehmigten' : 'ausstehenden'} Bewertungen gefunden.`}
                    </p>
                </div>
            )}

            {testimonials.length > 0 && (
                <div className="space-y-6">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className={`p-5 rounded-lg shadow-md border ${testimonial.approved ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'} ${styles.testimonialCard}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{testimonial.customerName}</p>
                                    {testimonial.email && <p className="text-xs text-gray-500">{testimonial.email}</p>}
                                    <p className="text-xs text-gray-500 mt-1">Eingegangen am: {formatDate(testimonial.createdAt)}</p>
                                </div>
                                <div className="mt-2 sm:mt-0">
                                    {renderStars(testimonial.rating)}
                                </div>
                            </div>
                            <p className={`text-gray-700 text-sm italic mb-4 leading-relaxed ${styles.testimonialComment}`}>
                                "{testimonial.comment}"
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-3 border-t border-gray-200">
                                {actionLoading === testimonial.id ? (
                                    <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-500" />
                                ) : (
                                    <>
                                        {testimonial.approved ? (
                                            <button
                                                onClick={() => handleUnapprove(testimonial.id)}
                                                className={`inline-flex items-center px-3 py-1.5 border border-yellow-500 text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${styles.actionButton}`}
                                                title="Genehmigung zurücknehmen"
                                            >
                                                <FontAwesomeIcon icon={faTimesCircle} className="mr-1.5" /> Nicht genehmigen
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApprove(testimonial.id)}
                                                className={`inline-flex items-center px-3 py-1.5 border border-green-500 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${styles.actionButton}`}
                                                title="Genehmigen"
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" /> Genehmigen
                                            </button>
                                        )}
                                        <button
                                            onClick={() => confirmDelete(testimonial.id)}
                                            className={`inline-flex items-center px-3 py-1.5 border border-red-500 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${styles.actionButton}`}
                                            title="Löschen"
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} className="mr-1.5" /> Löschen
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Bewertung löschen"
                    message="Möchten Sie diese Bewertung wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                    confirmButtonText="Ja, löschen"
                    icon={faTrashAlt}
                    iconColorClass="text-red-500"
                    isLoading={actionLoading === testimonialToDelete} // Ladezustand an Modal übergeben
                />
            )}
        </div>
    );
}

export default AdminTestimonialManagement;
