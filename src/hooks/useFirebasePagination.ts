import { useState, useEffect } from "react";
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    where,
    QueryDocumentSnapshot,
    DocumentData,
} from "firebase/firestore";
import { db } from "../../firebase";

interface UseFirebasePaginationProps {
    collectionName: string;
    itemsPerPage: number;
    orderByField: string;
    orderDirection?: "asc" | "desc";
    whereConditions?: Array<{
        field: string;
        operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "not-in" | "array-contains" | "array-contains-any";
        value: string | number | boolean;
    }>;
    searchTerm?: string;
    searchFields?: string[];
}

interface UseFirebasePaginationReturn<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalItems: number;
    nextPage: () => void;
    previousPage: () => void;
    goToPage: (page: number) => void;
    refresh: () => void;
}

/**
 * Custom hook for Firebase Firestore pagination
 * Uses server-side pagination with startAfter and limit
 */
export function useFirebasePagination<T = DocumentData>({
    collectionName,
    itemsPerPage,
    orderByField,
    orderDirection = "desc",
    whereConditions = [],
    searchTerm = "",
    searchFields = [],
}: UseFirebasePaginationProps): UseFirebasePaginationReturn<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageDocs, setPageDocs] = useState<QueryDocumentSnapshot[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);

    // Build the base query
    const buildQuery = (startAfterDoc?: QueryDocumentSnapshot) => {
        let q = query(
            collection(db, collectionName),
            orderBy(orderByField, orderDirection),
            limit(itemsPerPage)
        );

        // Add where conditions
        whereConditions.forEach((condition) => {
            q = query(q, where(condition.field, condition.operator, condition.value));
        });

        // Add startAfter if provided
        if (startAfterDoc) {
            q = query(q, startAfter(startAfterDoc));
        }

        return q;
    };

    // Fetch data for a specific page
    const fetchPage = async (page: number) => {
        try {
            setLoading(true);
            setError(null);

            let q;
            if (page === 1) {
                // First page - no startAfter
                q = buildQuery();
            } else {
                // Get the document to start after
                const startAfterDoc = pageDocs[page - 2];
                if (!startAfterDoc) {
                    throw new Error("Cannot navigate to this page");
                }
                q = buildQuery(startAfterDoc);
            }

            const querySnapshot = await getDocs(q);
            let newData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as T[];

            // Apply client-side search filtering if searchTerm is provided
            if (searchTerm && searchTerm.trim() && searchFields.length > 0) {
                const searchLower = searchTerm.toLowerCase();
                newData = newData.filter((item: T) => {
                    return searchFields.some(field => {
                        const fieldValue = (item as Record<string, unknown>)[field];
                        return fieldValue && 
                               typeof fieldValue === 'string' && 
                               fieldValue.toLowerCase().includes(searchLower);
                    });
                });
            }

            setData(newData);

            // Update page documents for navigation
            if (querySnapshot.docs.length > 0) {
                const newPageDocs = [...pageDocs];
                newPageDocs[page - 1] = querySnapshot.docs[querySnapshot.docs.length - 1];
                setPageDocs(newPageDocs);
            }

            // Check if there's a next page
            const hasNext = querySnapshot.docs.length === itemsPerPage;
            setHasNextPage(hasNext);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Navigation functions
    const nextPage = () => {
        if (hasNextPage && !loading) {
            const nextPageNum = currentPage + 1;
            setCurrentPage(nextPageNum);
            fetchPage(nextPageNum);
        }
    };

    const previousPage = () => {
        if (currentPage > 1 && !loading) {
            const prevPageNum = currentPage - 1;
            setCurrentPage(prevPageNum);
            fetchPage(prevPageNum);
        }
    };

    const goToPage = (page: number) => {
        if (page !== currentPage && !loading) {
            setCurrentPage(page);
            fetchPage(page);
        }
    };

    const refresh = () => {
        setCurrentPage(1);
        setPageDocs([]);
        fetchPage(1);
    };

    // Get total count (optional - can be expensive for large collections)
    const getTotalCount = async () => {
        try {
            const q = query(collection(db, collectionName));
            const snapshot = await getDocs(q);
            setTotalItems(snapshot.size);
        } catch (err) {
            console.error("Error getting total count:", err);
        }
    };

    // State for navigation
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const hasPreviousPage = currentPage > 1;

    // Calculate total pages (approximate)
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Initial fetch
    useEffect(() => {
        fetchPage(1);
        getTotalCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collectionName, itemsPerPage, orderByField, orderDirection, searchTerm, searchFields]);

    return {
        data,
        loading,
        error,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        totalItems,
        nextPage,
        previousPage,
        goToPage,
        refresh,
    };
} 