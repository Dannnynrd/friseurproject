import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCheckCircle, faTimesCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import './ConfirmModal.module.css';

function ConfirmModal({
                          isOpen,
                          onClose,
                          onConfirm,
                          title,
                          message,
                          confirmText = "Bestätigen",
                          cancelText = "Abbrechen",
                          type = "warning" // 'warning', 'danger', 'success', 'info'
                      }) {
    if (!isOpen) {
        return null;
    }

    let icon;
    let iconColorClass;
    let confirmButtonClass = 'button-link';

    switch (type) {
        case 'danger':
            icon = faExclamationTriangle;
            iconColorClass = 'icon-danger';
            confirmButtonClass += ' danger';
            break;
        case 'success':
            icon = faCheckCircle;
            iconColorClass = 'icon-success';
            // confirmButtonClass += ' success'; // Optional: Eigene Klasse für Erfolgs-Bestätigungsbutton
            break;
        case 'info':
            icon = faQuestionCircle;
            iconColorClass = 'icon-info';
            break;
        case 'warning':
        default:
            icon = faExclamationTriangle;
            iconColorClass = 'icon-warning';
            break;
    }

    return (
        <div className="modal-overlay confirm-modal-overlay" onClick={onClose}>
            <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-modal-icon-container">
                    <FontAwesomeIcon icon={icon} className={`confirm-icon ${iconColorClass}`} />
                </div>

                {title && <h3 className="confirm-modal-title">{title}</h3>}

                <p className="confirm-modal-message">{message}</p>

                <div className="modal-actions confirm-modal-actions">
                    <button onClick={onClose} className="button-link-outline cancel-action">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={confirmButtonClass}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;