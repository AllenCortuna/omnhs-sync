"use client";

import React from "react";
import { MdWarning, MdDelete } from "react-icons/md";

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    isLoading?: boolean;
}

/**
 * ConfirmDeleteModal Component
 * A reusable modal for confirming delete actions
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="avatar placeholder">
                        <div className="bg-error rounded-lg w-8 h-8 flex items-center justify-center text-white">
                            <MdWarning className="text-lg" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{title}</h3>
                        <p className="text-sm text-base-content/60">
                            This action cannot be undone
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-base-content/80 mb-2">
                        {message}
                    </p>
                    {itemName && (
                        <div className="bg-base-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <MdDelete className="text-error text-sm" />
                                <span className="text-sm font-medium">
                                    {itemName}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button
                        className="btn btn-outline btn-sm text-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-error btn-sm text-white"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <MdDelete className="text-sm" />
                        )}
                        Delete
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default ConfirmDeleteModal; 