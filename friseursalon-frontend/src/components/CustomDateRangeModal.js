import React from 'react';
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './CustomDateRangeModal.module.css';
import "react-datepicker/dist/react-datepicker.css";

const CustomDateRangeModal = ({ isOpen, onClose, onApply, startDate, setStartDate, endDate, setEndDate, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Schließen">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <h4 className={styles.modalTitle}>Benutzerdefinierten Zeitraum wählen</h4>
                <div className={styles.datePickersContainer}>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        placeholderText="Startdatum"
                        inline
                    />
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        placeholderText="Enddatum"
                        inline
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton} disabled={isLoading}>
                        Abbrechen
                    </button>
                    <button onClick={() => onApply(startDate, endDate)} className={styles.applyButton} disabled={isLoading || !startDate || !endDate}>
                        Anwenden
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomDateRangeModal;