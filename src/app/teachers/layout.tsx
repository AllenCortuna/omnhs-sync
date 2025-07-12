import TeacherRouteGuard from "@/components/common/TeacherRouteGuard";
import TeacherLayout from "@/components/teacher/TeacherLayout";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <TeacherRouteGuard>
            <TeacherLayout>{children}</TeacherLayout>
        </TeacherRouteGuard>
    );
};

export default layout;
