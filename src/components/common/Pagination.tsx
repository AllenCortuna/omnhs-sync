"use client";

import React from "react";
import ReactPaginate from "react-paginate";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    className?: string;
}

/**
 * Pagination Component
 * A reusable pagination component using react-paginate
 */
const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    className = "",
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageClick = (event: { selected: number }) => {
        onPageChange(event.selected + 1);
    };

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 p-4 border-t ${className}`}>
            {/* Items info */}
            <div className="text-xs text-base-content/60">
                Showing {startItem} to {endItem} of {totalItems} items
            </div>

            {/* React Paginate */}
            <ReactPaginate
                breakLabel="..."
                nextLabel={<MdChevronRight className="text-sm" />}
                onPageChange={handlePageClick}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
                pageCount={totalPages}
                previousLabel={<MdChevronLeft className="text-sm" />}
                containerClassName="join"
                pageClassName="join-item btn btn-xs"
                pageLinkClassName=""
                previousClassName="join-item btn btn-xs"
                previousLinkClassName=""
                nextClassName="join-item btn btn-xs"
                nextLinkClassName=""
                breakClassName="join-item btn btn-xs btn-disabled"
                breakLinkClassName=""
                activeClassName="btn-active"
                disabledClassName="btn-disabled"
                forcePage={currentPage - 1}
            />
        </div>
    );
};

export default Pagination; 