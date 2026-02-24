import { useState } from 'react';
import { Button } from './ui/button';
import { WebsiteManualModal } from './WebsiteManualModal';

export function HelpManualButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Open website manual"
        title="Website manual"
        className="font-medium"
      >
        User Manual
      </Button>
      <WebsiteManualModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
