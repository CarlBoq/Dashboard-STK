import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export interface ActionField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  placeholder?: string;
  value?: string;
  options?: string[];
}

export interface ActionFlowConfig {
  title: string;
  description: string;
  actionLabel?: string;
  successActionVerb?: string;
  entityLabel?: string;
  fields: ActionField[];
  readOnly?: boolean;
  onApply?: (values: Record<string, string>) => void;
}

interface ActionFlowModalProps {
  config: ActionFlowConfig | null;
  onClose: () => void;
}

export function ActionFlowModal({ config, onClose }: ActionFlowModalProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!config) {
      setIsEditOpen(false);
      setIsConfirmOpen(false);
      setIsCompletedOpen(false);
      setValues({});
      return;
    }

    const initialValues = config.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = field.value ?? '';
      return acc;
    }, {});

    setValues(initialValues);
    setIsEditOpen(true);
    setIsConfirmOpen(false);
    setIsCompletedOpen(false);
  }, [config]);

  const completedMessage = useMemo(() => {
    if (!config) return '';
    return `You have successfully ${config.successActionVerb ?? 'updated'} ${config.entityLabel ?? 'this item'}.`;
  }, [config]);

  if (!config) return null;

  const handleChange = (key: string, nextValue: string) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleRequestApply = () => {
    if (config.readOnly) {
      handleCloseAll();
      return;
    }
    setIsEditOpen(false);
    setIsConfirmOpen(true);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    setIsEditOpen(true);
  };

  const handleConfirmApply = () => {
    config.onApply?.(values);
    setIsConfirmOpen(false);
    setIsCompletedOpen(true);
  };

  const handleCloseAll = () => {
    setIsEditOpen(false);
    setIsConfirmOpen(false);
    setIsCompletedOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isEditOpen} onOpenChange={(open) => (!open ? handleCloseAll() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                {config.readOnly ? (
                  <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {values[field.key] || '-'}
                  </div>
                ) : field.type === 'select' ? (
                    <select
                      value={values[field.key] ?? ''}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    value={values[field.key] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            {config.readOnly ? (
              <Button onClick={handleCloseAll}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseAll}>
                  Cancel
                </Button>
                <Button onClick={handleRequestApply}>{config.actionLabel ?? 'Apply'}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => (!open ? handleCancelConfirm() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>You are about to apply changes to this data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelConfirm}>
              Cancel
            </Button>
            <Button onClick={handleConfirmApply}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompletedOpen} onOpenChange={(open) => (!open ? handleCloseAll() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action Completed</DialogTitle>
            <DialogDescription>{completedMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseAll}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
