// src/components/AdminTestimonialManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faTrashAlt, faSpinner, faExclamationCircle, faStar, faUser, faCommentDots, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal';
import './AdminTestimonialManagement.css'; // Eigene CSS-Datei
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';

const AdminTestimonialManagement = ({ currentUser }) => {
    const [testimonials, setTestimonials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null); // { type: 'approve'/'unapprove'/'delete', testimonial: {} }

    const formatDateForDisplay = (dateString) => {
        if (!dateString || !isValid(parseISO(dateString))) return 'N/A';
        return format(parseISO(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
    };

    const fetchTestimonials = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get('/testimonials/admin/all');
            setTestimonials(response.data || []);
        } catch (err) {
            console.error("Fehler beim Laden der Testimonials für Admin:", err);
            setError("Testimonials konnten nicht geladen werden.");
            setTestimonials([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    const handleAction = async () => {
        if (!actionToConfirm || !actionToConfirm.testimonial) return;

        setIsLoading(true); // Zeigt generellen Ladezustand
        const { type, testimonial } = actionToConfirm;
        let apiCall;
        let successMsg = '';

        switch (type) {
            case 'approve':
                apiCall = api.put(`/testimonials/admin/approve/${testimonial.id}`);
                successMsg = `Testimonial von "${testimonial.customerName}" genehmigt.`;
                break;
            case 'unapprove':
                apiCall = api.put(`/testimonials/admin/unapprove/${testimonial.id}`);
                successMsg = `Genehmigung für Testimonial von "${testimonial.customerName}" zurückgezogen.`;
                break;
            case 'delete':
                apiCall = api.delete(`/testimonials/admin/${testimonial.id}`);
                successMsg = `Testimonial von "${testimonial.customerName}" gelöscht.`;
                break;
            default:
                setIsLoading(false);
                return;
        }

        try {
            await apiCall;
            setSuccessMessage(successMsg);
            fetchTestimonials(); // Liste neu laden
        } catch (err) {
            console.error(`Fehler bei Aktion "${type}" für Testimonial ID ${testimonial.id}:`, err);
            setError(err.response?.data?.message || `Fehler bei Aktion "${type}".`);
        } finally {
            setIsLoading(false);
            setShowConfirmModal(false);
            setActionToConfirm(null);
            setTimeout(() => {
                setSuccessMessage('');
                setError('');
            }, 4000);
        }
    };

    const openConfirmModal = (type, testimonial) => {
        setActionToConfirm({ type, testimonial });
        setShowConfirmModal(true);
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={i <= rating ? 'star-filled' : 'star-empty'}
                />
            );
        }
        return <div className="testimonial-rating-stars">{stars}</div>;
    };


    if (isLoading && testimonials.length === 0) {
        return (
            <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p style={{ marginTop: '0.5rem' }}>Lade Testimonials...</p>
            </div>
        );
    }

    return (
        <div className="admin-testimonial-management">
            {error && <p className="form-message error mb-3"><FontAwesomeIcon icon={faExclamationCircle} /> {error}</p>}
            {successMessage && <p className="form-message success mb-3"><FontAwesomeIcon icon={faCheckCircle} /> {successMessage}</p>}

            {testimonials.length === 0 && !isLoading && (
                <p className="text-center text-gray-600 py-4">Keine Testimonials vorhanden.</p>
            )}

            {testimonials.length > 0 && (
                <div className="testimonials-admin-grid">
                    {testimonials.map(testimonial => (
                        <div key={testimonial.id} className={`testimonial-admin-card ${testimonial.isApproved ? 'approved' : 'pending'}`}>
                            <div className="testimonial-card-header">
                                <div className="testimonial-customer-info">
                                    <FontAwesomeIcon icon={faUser} className="icon" />
                                    <strong>{testimonial.customerName || (testimonial.customer ? `${testimonial.customer.firstName} ${testimonial.customer.lastName.charAt(0)}.` : 'Anonym')}</strong>
                                    {testimonial.service && <span className="testimonial-service-tag">({testimonial.service.name})</span>}
                                </div>
                                {renderStars(testimonial.rating)}
                            </div>
                            <p className="testimonial-comment-text">
                                <FontAwesomeIcon icon={faCommentDots} className="icon" />
                                {testimonial.comment}
                            </p>
                            <div className="testimonial-meta-info">
                                <span className="submission-date">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="icon" />
                                    Eingereicht: {formatDateForDisplay(testimonial.submissionDate)}
                                </span>
                                {testimonial.isApproved && testimonial.approvalDate && (
                                    <span className="approval-date">
                                        <FontAwesomeIcon icon={faCheckCircle} className="icon approved-icon" />
                                        Genehmigt: {formatDateForDisplay(testimonial.approvalDate)}
                                    </span>
                                )}
                                {!testimonial.isApproved && (
                                    <span className="status-badge status-pending">Ausstehend</span>
                                )}
                            </div>
                            <div className="testimonial-admin-actions">
                                {testimonial.isApproved ? (
                                    <button
                                        onClick={() => openConfirmModal('unapprove', testimonial)}
                                        className="button-link-outline small-button warning icon-button"
                                        disabled={isLoading}
                                        title="Genehmigung zurückziehen"
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                        Ablehnen
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => openConfirmModal('approve', testimonial)}
                                        className="button-link-outline small-button success icon-button"
                                        disabled={isLoading}
                                        title="Testimonial genehmigen"
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Genehmigen
                                    </button>
                                )}
                                <button
                                    onClick={() => openConfirmModal('delete', testimonial)}
                                    className="button-link-outline small-button danger icon-button"
                                    disabled={isLoading}
                                    title="Testimonial löschen"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                    Löschen
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => { setShowConfirmModal(false); setActionToConfirm(null);}}
                onConfirm={handleAction}
                title={`Bestätigung: ${actionToConfirm?.type === 'approve' ? 'Testimonial genehmigen?' : actionToConfirm?.type === 'unapprove' ? 'Genehmigung zurückziehen?' : 'Testimonial löschen?'}`}
                message={`Möchten Sie diese Aktion für das Testimonial von "${actionToConfirm?.testimonial?.customerName}" wirklich durchführen?`}
                confirmText="Ja, bestätigen"
                type={actionToConfirm?.type === 'delete' ? 'danger' : (actionToConfirm?.type === 'approve' ? 'success' : 'warning')}
            />
        </div>
    );
};

export default AdminTestimonialManagement;