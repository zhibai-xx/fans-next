export const triggerBrowserDownload = (url: string, filename?: string) => {
  if (!url) return;

  const link = document.createElement('a');
  link.href = url;
  if (filename) {
    link.download = filename;
  } else {
    link.target = '_blank';
  }
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
