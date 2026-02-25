import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AdminEditInfoModal } from "./components/AdminEditInfoModal";
import { OverviewPage } from "./components/pages/OverviewPage";
import { TimeRecordsPage } from "./components/pages/TimeRecordsPage";
import { ActivityLogsPage } from "./components/pages/ActivityLogsPage";
import { UsersPage } from "./components/pages/UsersPage";
import { ArchivedUsersPage } from "./components/pages/ArchivedUsersPage";
import { TimeAdjustmentPage } from "./components/pages/TimeAdjustmentPage";
import { SchedulesPage } from "./components/pages/SchedulesPage";
import { BreaklistSummaryPage } from "./components/pages/BreaklistSummaryPage";
import { GeneratedBreaklistPage } from "./components/pages/GeneratedBreaklistPage";
import { EditBreaklistPage } from "./components/pages/EditBreaklistPage";

const PRODUCT_NAME = "Sparkle Timekeeping Admin Dashboard";

const pagePaths: Record<string, string> = {
  overview: "/dashboard/overview",
  "time-records": "/time-records",
  "activity-logs": "/activity-logs",
  users: "/users",
  "archived-users": "/archived-users",
  "time-adjustment": "/time-adjustment",
  schedules: "/schedules",
  "breaklist-summary": "/breaklist-summary",
  "generated-breaklist": "/generated-breaklist",
  "edit-breaklist": "/edit-breaklist",
};

const basePath = (() => {
  const rawBase = import.meta.env.BASE_URL ?? "/";
  const trimmed = rawBase.endsWith("/") && rawBase.length > 1
    ? rawBase.slice(0, -1)
    : rawBase;
  return trimmed === "/" ? "" : trimmed;
})();

const withBasePath = (path: string) => {
  if (basePath.length === 0) return path;
  return `${basePath}${path}`;
};

const stripBasePath = (pathname: string) => {
  if (basePath.length === 0) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }
  return pathname;
};

const pathToPage = (pathname: string): string | null => {
  const pathWithoutBase = stripBasePath(pathname);
  const normalized =
    pathWithoutBase.endsWith("/") && pathWithoutBase.length > 1
      ? pathWithoutBase.slice(0, -1)
      : pathWithoutBase;

  if (normalized === "/dashboard") {
    return "overview";
  }

  const pageEntry = Object.entries(pagePaths).find(
    ([, path]) => path === normalized,
  );
  return pageEntry?.[0] ?? null;
};

interface BreadcrumbItem {
  label: string;
  page?: string;
}

export default function App() {
  const [activePage, setActivePage] = useState(
    () => pathToPage(window.location.pathname) ?? "overview",
  );
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const syncFromPath = () => {
      const nextPathname = stripBasePath(window.location.pathname);
      const nextPage = pathToPage(window.location.pathname);

      if (nextPathname === "/dashboard") {
        window.history.replaceState({}, "", withBasePath("/dashboard/overview"));
      }

      setActivePage(nextPage ?? "overview");
    };

    syncFromPath();
    window.addEventListener("popstate", syncFromPath);
    return () => window.removeEventListener("popstate", syncFromPath);
  }, []);

  useEffect(() => {
    const nextPath = pagePaths[activePage] ?? "/dashboard/overview";
    const nextPathWithBase = withBasePath(nextPath);
    if (window.location.pathname !== nextPathWithBase) {
      window.history.pushState({}, "", nextPathWithBase);
    }
  }, [activePage]);

  const getPageContent = () => {
    switch (activePage) {
      case "overview":
        return <OverviewPage />;
      case "time-records":
        return <TimeRecordsPage />;
      case "activity-logs":
        return <ActivityLogsPage />;
      case "users":
        return <UsersPage />;
      case "archived-users":
        return <ArchivedUsersPage />;
      case "time-adjustment":
        return <TimeAdjustmentPage />;
      case "schedules":
        return <SchedulesPage />;
      case "breaklist-summary":
        return <BreaklistSummaryPage />;
      case "generated-breaklist":
        return <GeneratedBreaklistPage />;
      case "edit-breaklist":
        return <EditBreaklistPage />;
      default:
        return <OverviewPage />;
    }
  };

  const getPageInfo = () => {
    const pageConfig: Record<
      string,
      { title: string; breadcrumbs: BreadcrumbItem[] }
    > = {
      overview: {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Overview" },
        ],
      },
      "time-records": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Time Records" },
        ],
      },
      "activity-logs": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Activity Logs" },
        ],
      },
      users: {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "User Management", page: "users" },
          { label: "Users" },
        ],
      },
      "archived-users": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "User Management", page: "users" },
          { label: "Archived Users" },
        ],
      },
      "time-adjustment": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Time Management", page: "time-adjustment" },
          { label: "Time Adjustment" },
        ],
      },
      schedules: {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Time Management", page: "time-adjustment" },
          { label: "Schedules" },
        ],
      },
      "breaklist-summary": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Time Management", page: "time-adjustment" },
          { label: "Breaklist Summary" },
        ],
      },
      "generated-breaklist": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Time Management", page: "time-adjustment" },
          { label: "Generated Breaklist" },
        ],
      },
      "edit-breaklist": {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Time Management", page: "time-adjustment" },
          { label: "Edit Breaklist" },
        ],
      },
    };

    return (
      pageConfig[activePage] || {
        title: PRODUCT_NAME,
        breadcrumbs: [
          { label: PRODUCT_NAME, page: "overview" },
          { label: "Overview" },
        ],
      }
    );
  };

  const getEditableInfoText = () => {
    const sectionConfig: Record<string, string> = {
      overview: "Admins can view attendance summaries and system-wide metrics.",
      "time-records":
        "Admins can edit time-in, time-out, break entries, and mark records as incomplete or reviewed.",
      "activity-logs":
        "This section is view-only. Admins cannot edit activity logs.",
      users:
        "Admins can edit user status, assigned schedules, and access permissions.",
      "archived-users":
        "Admins can edit user status, assigned schedules, and access permissions.",
      "time-adjustment":
        "Admins can edit time-in, time-out, break entries, and mark records as incomplete or reviewed.",
      schedules:
        "Admins can edit shift times, break rules, and schedule assignments.",
      "breaklist-summary":
        "Admins can edit break durations and regenerate break schedules.",
      "generated-breaklist":
        "Admins can edit break durations and regenerate break schedules.",
      "edit-breaklist":
        "Admins can edit break durations and regenerate break schedules.",
    };

    return sectionConfig[activePage] ?? sectionConfig.overview;
  };

  const pageInfo = getPageInfo();
  const handlePageChange = (page: string) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar
        activePage={activePage}
        onPageChange={handlePageChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="md:ml-64">
        <Header
          title={pageInfo.title}
          breadcrumbs={pageInfo.breadcrumbs}
          onBreadcrumbClick={handlePageChange}
          onOpenEditInfo={() => setIsEditInfoModalOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="p-4 md:p-8">{getPageContent()}</main>
      </div>
      <AdminEditInfoModal
        open={isEditInfoModalOpen}
        onClose={() => setIsEditInfoModalOpen(false)}
        sectionText={getEditableInfoText()}
      />
    </div>
  );
}
