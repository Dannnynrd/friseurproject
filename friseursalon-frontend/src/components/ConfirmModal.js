// friseursalon-frontend/src/components/ConfirmModal.js
import React from 'react';
import styles from './ConfirmModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamationTriangle, faSpinner, faCheck, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

function ConfirmModal({
                          isOpen,
                          onClose,
                          onConfirm,
                          title,
                          message,
                          confirmButtonText = "Bestätigen",
                          cancelButtonText = "Abbrechen",
                          isLoading = false,
                          icon = faExclamationTriangle, // Standard-Icon
                          iconColorClass = "text-red-500" // Standard-Icon-Farbe für Warnungen
                      }) {

    if (!isOpen) {
        return null;
    }

    return (
        // Modal Overlay
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1060] p-4 animate-fadeInModalOverlay backdrop-blur-sm"> {/* Höherer z-index als ServiceEditModal */}
            {/* Modal Content */}
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-md animate-slideInModalContent ${styles.modalContent}`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className={`text-lg font-semibold text-gray-800 flex items-center ${styles.modalTitle}`}>
                        <FontAwesomeIcon icon={icon} className={`mr-3 ${iconColorClass}`} />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Modal schließen"
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        disabled={isLoading}
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 text-sm text-gray-600 leading-relaxed">
                    {typeof message === 'string' ? <p>{message}</p> : message}
                </div>

                {/* Modal Footer / Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row-reverse sm:justify-start space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse rounded-b-lg">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                                    ${icon === faTrashAlt || iconColorClass === "text-red-500" ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-accent hover:bg-accent-dark focus:ring-accent'} 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${styles.actionButton} ${styles.confirmButton}`}
                    >
                        {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        ) : (
                            <FontAwesomeIcon icon={icon === faTrashAlt ? faTrashAlt : faCheck} className="mr-2" />
                        )}
                        {confirmButtonText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className={`w-full sm:w-auto inline-flex justify-center px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors duration-150 disabled:opacity-60 ${styles.actionButton} ${styles.cancelButton}`}
                    >
                        {cancelButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;