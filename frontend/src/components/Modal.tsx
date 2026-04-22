// frontend/src/components/Modal.tsx
import React from 'react';
import Portal from './Portal'; // Import the Portal component
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>{title}</h2>
                        <button className={styles.closeButton} onClick={onClose}>&times;</button>
                    </div>
                    <div className={styles.modalBody}>
                        {children}
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default Modal;