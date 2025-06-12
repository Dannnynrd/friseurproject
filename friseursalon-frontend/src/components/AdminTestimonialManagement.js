import React, { useState, useEffect, useCallback } from 'react';
import testimonialService from '../services/testimonial.service';
import styles from './AdminTestimonialManagement.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faTrashAlt, faSpinner, faExclamationTriangle, faStar, faFilter, faUser, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal';

function AdminTestimonialManagement() {
    const [testimonials, setTestimonials] = useState([]);
    const [allTestimonials, setAllTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [filter, setFilter] = useState('ALL'); // 'ALL', 'APPROVED', 'PENDING'
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [testimonialToDelete, setTestimonialToDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchTestimonials = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await testimonialService.getAllTestimonials();
            const sortedTestimonials = (response.data || []).sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
            setAllTestimonials(sortedTestimonials);
        } catch (err) {
            setError(err.response?.data?.message || "Bewertungen konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    useEffect(() => {
        let filtered = allTestimonials;
        if (filter === 'APPROVED') {
            filtered = allTestimonials.filter(t => t.isApproved);
        } else if (filter === 'PENDING') {
            filtered = allTestimonials.filter(t => !t.isApproved);
        }
        setTestimonials(filtered);
    }, [filter, allTestimonials]);

    const handleAction = async (action, id) => {
        setActionLoading(id);
        setError('');
        setSuccessMessage('');
        try {
            let response;
            let successMsg = '';
            let isDelete = false;

            if (action === 'approve') {
                response = await testimonialService.approveTestimonial(id);
                successMsg = "Bewertung erfolgreich genehmigt.";
            } else if (action === 'unapprove') {
                response = await testimonialService.unapproveTestimonial(id);
                successMsg = "Genehmigung zurückgenommen.";
            } else if (action === 'delete') {
                response = await testimonialService.deleteTestimonial(id);
                successMsg = "Bewertung erfolgreich gelöscht.";
                isDelete = true;
            }

            setSuccessMessage(successMsg);
            if (isDelete) {
                setAllTestimonials(prev => prev.filter(t => t.id !== id));
            } else {
                setAllTestimonials(prev => prev.map(t => t.id === id ? response.data : t));
            }

        } catch (err) {
            setError(err.response?.data?.message || `Fehler bei der Aktion: ${action}.`);
        } finally {
            setActionLoading(null);
            setShowConfirmDeleteModal(false);
            setTestimonialToDelete(null);
        }
    };

    const confirmDelete = (id) => {
        setTestimonialToDelete(id);
        setShowConfirmDeleteModal(true);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const renderStars = (rating) => Array(5).fill(null).map((_, i) => <FontAwesomeIcon key={i} icon={faStar} className={i < rating ? "text-yellow-400" : "text-gray-300"} />);

    if (loading) return <div className="p-10 text-center"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" /></div>;

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.testimonialManagementContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif">Bewertungen verwalten</h2>
                <div className="mt-3 sm:mt-0 flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                    {['ALL', 'PENDING', 'APPROVED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${filter === f ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-white/60'}`}>
                            {f === 'ALL' ? 'Alle' : f === 'PENDING' ? 'Ausstehend' : 'Genehmigt'}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className={`mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.message}`}><FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />{error}</div>}
            {successMessage && <div className={`mb-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm flex items-center ${styles.message}`}><FontAwesomeIcon icon={faCheckCircle} className="mr-2" />{successMessage}</div>}

            <div className="space-y-6">
                {testimonials.length === 0 ? (
                    <div className="text-center py-8 px-6 bg-slate-50 rounded-lg"><p className="text-gray-500">Keine Bewertungen in dieser Ansicht gefunden.</p></div>
                ) : (
                    testimonials.map(t => (
                        <div key={t.id} className={`p-5 rounded-lg shadow-md border ${t.isApproved ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'} ${styles.testimonialCard}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                                <div>
                                    <p className="text-md font-semibold text-gray-800">{t.customerName}</p>
                                    <p className="text-xs text-gray-500">Eingegangen am: {formatDate(t.submissionDate)}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 flex items-center gap-x-2">{renderStars(t.rating)}</div>
                            </div>
                            <p className={`text-gray-700 text-sm italic mb-4 leading-relaxed ${styles.testimonialComment}`}><FontAwesomeIcon icon={faQuoteLeft} className="text-gray-300 mr-2 text-xs" />{t.comment}</p>
                            <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-3 border-t border-gray-200/50">
                                {actionLoading === t.id ? <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-500" /> : (
                                    <>
                                        {t.isApproved ? (
                                            <button onClick={() => handleAction('unapprove', t.id)} className={`inline-flex items-center px-3 py-1.5 border border-yellow-500 text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 ${styles.actionButton}`}><FontAwesomeIcon icon={faTimesCircle} className="mr-1.5" /> Genehmigung zurückziehen</button>
                                        ) : (
                                            <button onClick={() => handleAction('approve', t.id)} className={`inline-flex items-center px-3 py-1.5 border border-green-500 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 ${styles.actionButton}`}><FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" /> Genehmigen</button>
                                        )}
                                        <button onClick={() => confirmDelete(t.id)} className={`inline-flex items-center px-3 py-1.5 border border-red-500 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 ${styles.actionButton}`}><FontAwesomeIcon icon={faTrashAlt} className="mr-1.5" /> Löschen</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {showConfirmDeleteModal && <ConfirmModal isOpen={showConfirmDeleteModal} onClose={() => setShowConfirmDeleteModal(false)} onConfirm={() => handleAction('delete', testimonialToDelete)} title="Bewertung löschen" message="Möchten Sie diese Bewertung wirklich endgültig löschen?" confirmButtonText="Ja, löschen" icon={faTrashAlt} />}
        </div>
    );
}

export default AdminTestimonialManagement;