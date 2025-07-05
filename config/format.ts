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
