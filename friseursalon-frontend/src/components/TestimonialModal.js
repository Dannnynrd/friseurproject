// src/components/TestimonialModal.js
import React, { useEffect, useRef } from 'react';
import styles from './TestimonialModal.module.css';
import { FiX } from 'react-icons/fi';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';

const StarRating = ({ rating }) => (
    <div className={styles.starRating}>
        {[...Array(5)].map((_, index) => (
            <FaStar key={index} color={index < rating ? '#ffc107' : '#e4e5e9'} />
        ))}
    </div>
);

const TestimonialModal = ({ testimonial, onClose }) => {
    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    if (!testimonial) return null;

    return (
        <div className={styles.modalOverlay}>
            <div ref={modalRef} className={styles.modalContent}>
                <button onClick={onClose} className={styles.closeButton}><FiX size={24} /></button>
                <FaQuoteLeft className={styles.quoteIcon} />
                <StarRating rating={testimonial.rating} />
                <p className={styles.testimonialText}>{testimonial.text}</p>
                <p className={styles.testimonialAuthor}>- {testimonial.author}</p>
            </div>
        </div>
    );
};

export default TestimonialModal;