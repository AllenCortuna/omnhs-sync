import AdminLayout from "@/components/admin/AdminLayout";
import AdminRouteGuard from "@/components/common/AdminRouteGuard";

export const metadata = {
    title: "OMNHS SYNC Admin",
    description: "Occidental Mindanao National High School Sync Admin",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminRouteGuard>
            <AdminLayout>{children}</AdminLayout>
        </AdminRouteGuard>
    );
}
