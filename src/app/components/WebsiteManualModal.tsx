import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface WebsiteManualModalProps {
  open: boolean;
  onClose: () => void;
}

export function WebsiteManualModal({ open, onClose }: WebsiteManualModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Website User Manual</DialogTitle>
          <DialogDescription>
            Quick guide for using the Sparkle Timekeeping Admin Dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-700">
          <section>
            <h3 className="font-semibold text-gray-900 mb-1">1. Navigation</h3>
            <p>Use the left sidebar to move between sections.</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>DASHBOARD: Overview, Time Records, Activity Logs.</li>
              <li>User Management: Users and Archived Users.</li>
              <li>Time Management: Time Adjustment, Schedules, and Breaklist pages.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">2. Header Tools</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Search field: Finds items in the active page context.</li>
              <li>What can I edit?: Shows page-specific editable data guidance.</li>
              <li>User Manual: Opens this manual.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">3. Routing and Breadcrumbs</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dashboard default page is <span className="font-medium">Overview</span>.</li>
              <li>Navigating to <span className="font-medium">/dashboard</span> redirects to <span className="font-medium">/dashboard/overview</span>.</li>
              <li>Breadcrumb links are clickable for quick navigation.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">4. Table Filters and Pagination</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use <span className="font-medium">Store Name</span> and <span className="font-medium">Search (ID / Email)</span> where available.</li>
              <li>Click <span className="font-medium">Search</span> to apply table filters.</li>
              <li>Use the refresh icon button to reset filters and reload local table data.</li>
              <li>Tables use shared pagination: Previous, Next, page jump input, page indicator, and rows-per-page selector.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">5. Time Adjustment Page</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Row actions include <span className="font-medium">View</span>, <span className="font-medium">Edit Record</span>, <span className="font-medium">Delete Record</span>, and <span className="font-medium">Delete Previous Record</span>.</li>
              <li><span className="font-medium">View</span> opens a full summary modal showing all columns for the selected user.</li>
              <li><span className="font-medium">Log</span> opens a wide modal with adjustment history columns including break in/out and adjusted break in/out.</li>
              <li><span className="font-medium">n/a-</span> indicates incomplete records (for example, no time-out or no break usage yet).</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">6. Schedules Page</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Calendar supports start/end range selection.</li>
              <li>Past dates are muted and not selectable.</li>
              <li>Today is highlighted, and future dates are selectable.</li>
              <li>Use <span className="font-medium">days up to today</span> and <span className="font-medium">days starting today</span> to quickly set ranges.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">7. Notes</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>This dashboard is UI-focused and uses local/mock state.</li>
              <li>Actions and modals demonstrate workflow behavior without backend calls.</li>
            </ul>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
