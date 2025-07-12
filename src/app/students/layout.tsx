import React from "react";
import StudentLayout from "@/components/student/StudentLayout";
import StudentRouteGuard from "@/components/common/StudentRouteGuard";

const layout = (props: { children: React.ReactNode }) => {
    const { children } = props;
    return (
        <StudentRouteGuard>
            <StudentLayout>{children}</StudentLayout>
        </StudentRouteGuard>
    );
};

export default layout;
