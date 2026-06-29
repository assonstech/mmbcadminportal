import { useEffect, useState } from 'react';
import CommonAlertDialog from './CommonAlertDialog';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = '5 MB';

export default function UploadSizeGuard() {
  const [alert, setAlert] = useState({
    open: false,
    message: '',
  });

  useEffect(() => {
    const handleFileChange = (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;

      const files = Array.from(input.files || []);
      const oversizedFile = files.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES);

      if (!oversizedFile) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      input.value = '';

      setAlert({
        open: true,
        message: `"${oversizedFile.name}" is larger than ${MAX_UPLOAD_SIZE_LABEL}. Please choose a smaller file.`,
      });
    };

    document.addEventListener('change', handleFileChange, true);

    return () => {
      document.removeEventListener('change', handleFileChange, true);
    };
  }, []);

  return (
    <CommonAlertDialog
      open={alert.open}
      title="File too large"
      message={alert.message}
      color="error"
      onClose={() => setAlert({ open: false, message: '' })}
    />
  );
}
