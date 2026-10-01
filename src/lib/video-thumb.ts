export function videoThumbnail(videoUrl?: string | null): string | null {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, '');
    let id: string | null | undefined;
    if (host === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0];
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      id =
        url.searchParams.get('v') ||
        url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    }
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}