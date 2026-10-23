const quotedFilename = /filename="([^"]+)"/i;
const plainFilename = /filename=([^;]+)/i;
const encodedFilename = /filename\*=UTF-8''([^;]+)/i;

export function reportFilename(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;

  const encoded = contentDisposition.match(encodedFilename)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return fallback;
    }
  }

  return (
    contentDisposition.match(quotedFilename)?.[1] ??
    contentDisposition.match(plainFilename)?.[1]?.trim() ??
    fallback
  );
}

export function saveBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  // Some browsers ignore clicks on detached download links.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoking immediately can cancel a download before the browser reads it.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
