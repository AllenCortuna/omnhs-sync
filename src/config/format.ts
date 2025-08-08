/**
 * Formats currency values
 */
export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(amount);
};

/**
 * Formats date for display
 */
export const formatDate = (date: string | { seconds: number; nanoseconds: number }): string => {
    const dateObj = typeof date === 'string' 
        ? new Date(date)
        : new Date(date.seconds * 1000);

    return dateObj.toLocaleDateString("en-US", {
        year: "numeric", 
        month: "short",
        day: "numeric"
    });
};
