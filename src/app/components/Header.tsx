import { Bell, Search, ChevronRight, Menu } from 'lucide-react';
import { HelpManualButton } from './HelpManualButton';

interface BreadcrumbItem {
  label: string;
  page?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  onBreadcrumbClick: (page: string) => void;
  onOpenEditInfo: () => void;
  onOpenSidebar: () => void;
  onOpenActionsPanel: () => void;
}

export function Header({
  title,
  breadcrumbs = [],
  onBreadcrumbClick,
  onOpenEditInfo,
  onOpenSidebar,
  onOpenActionsPanel,
}: HeaderProps) {
  return (
    <div className="px-4 md:px-8 py-4 border-b bg-white border-gray-200">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          {breadcrumbs.length > 0 && (
            <div className="hidden md:flex items-center gap-2 text-sm mb-1 text-gray-500">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {crumb.page && index < breadcrumbs.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => onBreadcrumbClick(crumb.page!)}
                      className="transition-colors hover:text-[#1F4FD8]"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className={index === breadcrumbs.length - 1 ? 'text-[#1F4FD8] font-medium' : ''}>
                      {crumb.label}
                    </span>
                  )}
                  {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4" />}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="xl:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent w-56 xl:w-64 border border-gray-300 text-gray-900"
            />
          </div>
          
          <button
            type="button"
            className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <HelpManualButton />
          <button
            type="button"
            onClick={onOpenEditInfo}
            className="hidden sm:inline-flex px-3 py-2 text-sm border rounded-lg transition-colors border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            What can I edit?
          </button>
          <button
            type="button"
            onClick={onOpenActionsPanel}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label="Open quick actions panel"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
