import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface AdminEditInfoModalProps {
  open: boolean;
  onClose: () => void;
  sectionText: string;
}

export function AdminEditInfoModal({ open, onClose, sectionText }: AdminEditInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Editable Data</DialogTitle>
          <DialogDescription>
            This section shows what data administrators are allowed to edit.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-gray-700 space-y-3">
          <p>{sectionText}</p>
          <p>
            Editable fields may include time records, schedules, breaks, and user-related data depending
            on the selected section.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
