import { useEffect, type ComponentType } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  MailCheck,
  Users,
  CalendarDays,
  ClipboardCheck,
  Database,
  Mail,
  FilePenLine,
  LogOut,
} from 'lucide-react';

interface AdminActionsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  highlighted?: boolean;
}

const actionItems: ActionItem[] = [
  { id: 'edit-company', label: 'Edit Company', icon: Pencil },
  { id: 'update-email', label: 'Update Email', icon: MailCheck, highlighted: true },
  { id: 'generate-users', label: 'Generate Active Users', icon: Users },
  { id: 'set-holiday', label: 'Set Holiday', icon: CalendarDays },
  { id: 'set-checklist', label: 'Set Checklist', icon: ClipboardCheck },
  { id: 'extract-stores', label: 'Extract Stores', icon: Database },
  { id: 'approval-email', label: 'Breaklist Approval Email', icon: Mail },
  { id: 'edit-request-flow', label: 'Edit Request Process Flow', icon: FilePenLine },
];

export function AdminActionsPanel({ open, onClose }: AdminActionsPanelProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Close quick actions panel"
        onClick={onClose}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 h-screen w-[84vw] max-w-[320px] bg-[#ececec] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="relative h-24 shrink-0 rounded-b-[26px] bg-gradient-to-r from-[#1da4e8] to-[#20d4c8]">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-6 rounded-md p-1 text-white/95 hover:bg-white/20"
            aria-label="Close panel"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
            <div className="h-14 w-14 rounded-full border-2 border-white bg-[#f2e8da] shadow-sm flex items-center justify-center">
              <span className="text-lg font-semibold text-[#1F4FD8]">A</span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-10">
          <div className="mb-5 text-center">
            <h3 className="mt-1 text-2xl font-semibold text-[#1f2937]">sparkledemo admin</h3>
            <p className="mt-1 text-sm text-[#1f2937]">sparkletimekeepingdemo+3@gmail.com</p>
          </div>

          <nav className="space-y-2">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[#1f2a3a] transition-colors ${
                    item.highlighted ? 'bg-[#e3e4e6]' : 'hover:bg-[#e6e7e9]'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-[17px] leading-snug">{item.label}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#2d3748]" />
                </button>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-[#d2d5da] pt-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[#1f2a3a] hover:bg-[#e6e7e9]"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-[17px] leading-tight">Logout</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#2d3748]" />
            </button>
          </div>
        </div>

        <div className="h-16 shrink-0 rounded-t-[26px] bg-gradient-to-r from-[#1da4e8] to-[#20d4c8]" />
      </aside>
    </>
  );
}
