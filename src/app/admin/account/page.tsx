"use client";

// React and Firebase imports
import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase"; // Adjust path to your Firebase config

// Icon imports from react-icons
import { FaUsers, FaSpinner, FaExclamationCircle, FaUserCircle, FaEnvelope, FaCalendarAlt, FaUserTag, FaBan, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { TiWarning } from "react-icons/ti";
import { successToast, errorToast } from "@/config/toast";
import Link from "next/link";
import { useCurrentAdmin } from "@/hooks";

interface AccountData {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string | Timestamp;
    restricted?: boolean;
}

const AccountList: React.FC = () => {
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);
    const { admin } = useCurrentAdmin();
    
    // Search and filter states
    const [searchUsername, setSearchUsername] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("all");

    // Get unique roles for filter dropdown
    const uniqueRoles = useMemo(() => {
        const roles = Array.from(new Set(accounts.map(account => account.role)));
        return roles.sort();
    }, [accounts]);

    // Filtered accounts based on search and role filter
    const filteredAccounts = useMemo(() => {
        return accounts.filter(account => {
            const matchesSearch = searchUsername === "" || 
                account.name.toLowerCase().includes(searchUsername.toLowerCase());
            const matchesRole = selectedRole === "all" || account.role === selectedRole;
            return matchesSearch && matchesRole;
        });
    }, [accounts, searchUsername, selectedRole]);

    const handleToggleRestriction = async (accountId: string, currentRestricted: boolean) => {
        setUpdatingAccountId(accountId);
        try {
            const accountRef = doc(db, "admin", accountId);
            await updateDoc(accountRef, {
                restricted: !currentRestricted
            });

            // Update local state
            setAccounts(prev => prev.map(account => 
                account.id === accountId 
                    ? { ...account, restricted: !currentRestricted }
                    : account
            ));

            successToast(`Account ${!currentRestricted ? 'disabled' : 'enabled'} successfully!`);

        } catch (error) {
            console.error("Error updating account restriction:", error);
            errorToast("Failed to update account status. Please try again.");
        } finally {
            setUpdatingAccountId(null);
        }
    };

    // Clear search and filter
    const clearFilters = () => {
        setSearchUsername("");
        setSelectedRole("all");
    };

    useEffect(() => {
        const fetchAccounts = async (): Promise<void> => {
            setLoading(true);
            setFetchError(null);
            try {
                const accountsQuery = query(collection(db, "admin"));
                const accountsSnapshot = await getDocs(accountsQuery);

                const accountsList: AccountData[] = accountsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || "N/A",
                        email: data.email || "N/A",
                        role: data.role || "user",
                        createdAt: data.createdAt,
                        restricted: data.restricted || false,
                    } as AccountData;
                });
                setAccounts(accountsList);
            } catch (err) {
                console.error("Error fetching accounts:", err);
                setFetchError("Failed to load accounts. Please try refreshing the page.");
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/admin/account/create" className="btn btn-primary mb-4 text-white font-medium rounded-none fixed right-10 top-10 z-40">Create Account</Link>
            <div className="card w-full bg-base-100 shadow-xl border border-neutral-content/20">
                <div className="card-body">
                    <h2 className="card-title text-2xl font-bold mb-6 text-primary flex items-center">
                        <FaUsers className="mr-3 text-3xl" />
                        Registered User Accounts
                    </h2>

                    {/* Search and Filter Section */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-base-200 rounded-lg">
                        {/* Search by Username */}
                        <div className="form-control flex-1">
                            <label className="label">
                                <span className="label-text text-xs font-medium text-zinc-500">
                                    Search by Username
                                </span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter username to search..."
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                className="input input-bordered input-sm w-80 text-zinc-700 rounded-none text-xs"
                            />
                        </div>

                        {/* Filter by Role */}
                        <div className="form-control flex-1">
                            <label className="label">
                                <span className="label-text text-xs font-medium text-zinc-500">
                                    Filter by Role
                                </span>
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="select select-bordered select-sm w-80 text-zinc-600 rounded-none text-xs"
                            >
                                <option value="all"></option>
                                {uniqueRoles.map(role => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="form-control self-end">
                            <button
                                onClick={clearFilters}
                                className="btn btn-outline btn-sm text-zinc-600 rounded-none text-xs"
                                disabled={searchUsername === "" && selectedRole === "all"}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="mb-4 text-sm text-base-content/70">
                        Showing {filteredAccounts.length} of {accounts.length} accounts
                        {(searchUsername || selectedRole !== "all") && (
                            <span className="ml-2">
                                (filtered by {searchUsername ? `"${searchUsername}"` : ""}
                                {searchUsername && selectedRole !== "all" ? " and " : ""}
                                {selectedRole !== "all" ? `role: ${selectedRole}` : ""})
                            </span>
                        )}
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center justify-center min-h-[250px] text-primary">
                            <FaSpinner className="animate-spin text-5xl mb-5" />
                            <p className="text-xl">Loading Accounts...</p>
                        </div>
                    )}

                    {!loading && fetchError && (
                        <div role="alert" className="alert alert-error min-h-[250px] flex-col items-center justify-center">
                            <FaExclamationCircle className="text-5xl mb-3" />
                            <span className="text-xl font-semibold">Error Fetching Data</span>
                            <p className="text-center">{fetchError}</p>
                        </div>
                    )}

                    {!loading && !fetchError && filteredAccounts.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[250px] text-secondary">
                            <FaExclamationCircle className="text-5xl mb-4" />
                            <p className="text-xl font-semibold">No Accounts Found</p>
                            <p className="text-sm text-base-content/70">
                                {searchUsername || selectedRole !== "all" 
                                    ? "No accounts match your current search criteria. Try adjusting your filters."
                                    : "There are currently no user accounts to display."
                                }
                            </p>
                        </div>
                    )}

                    {!loading && !fetchError && filteredAccounts.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="table w-full table-pin-rows table-pin-cols">
                                <thead className="text-xs">
                                    <tr>
                                        <th className="p-4"><FaUserCircle className="inline mr-2 text-xs" />Name</th>
                                        <th className="p-4"><FaEnvelope className="inline mr-2 text-xs" />Email</th>
                                        <th className="p-4"><FaUserTag className="inline mr-2 text-xs" />Role</th>
                                        <th className="p-4"><FaCalendarAlt className="inline mr-2 text-xs" />Date Created</th>
                                        <th className="p-4"><TiWarning className="inline mr-2 text-xs" />Status</th>
                                        <th className="p-4"><FaBan className="inline mr-2 text-xs" />Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.map((account) => (
                                        <tr key={account.id} className={`hover text-zinc-700 text-xs`}>
                                            <td className="p-4 font-medium">{account.name}</td>
                                            <td className="p-4 whitespace-nowrap">{account.email}</td>
                                            <td className="p-4">
                                                <span className="badge badge-outline badge-sm">
                                                    {account.role}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {account.createdAt instanceof Object && 'toDate' in account.createdAt ? account.createdAt.toDate().toLocaleDateString() : account.createdAt}
                                            </td>
                                            <td className="p-4">
                                                <span className={`badge text-xs text-white ${account.restricted ? 'badge-error' : 'badge-success'} badge-sm`}>
                                                    {account.restricted ? 'Disabled' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {(admin?.role === 'admin' && account?.role !== 'admin') && (
                                                <button 
                                                    className={`btn btn-xs font-normal text-white ${account.restricted ? 'btn-success' : 'btn-error'} flex items-center`}
                                                    onClick={() => handleToggleRestriction(account.id, account.restricted || false)}
                                                    disabled={updatingAccountId === account.id}
                                                >
                                                    {updatingAccountId === account.id ? (
                                                        <FaSpinner className="animate-spin mr-1" />
                                                    ) : account.restricted ? (
                                                        <>
                                                            <FaToggleOn className="mr-1" />
                                                            Enable
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaToggleOff className="mr-1" />
                                                            Disable
                                                        </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountList;