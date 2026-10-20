/**
 * Shows the whole image (object-contain), never cropping it, inside a box of
 * whatever size the caller sets via className. Spare space is filled with a
 * blurred, enlarged copy of the same image so flyers of any shape look intentional.
 * Event covers are often flyers with text, so cropping would hide information.
 */
export function FullImage({
  src,
  alt,
  className = "",
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        loading={loading}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={loading} className="relative h-full w-full object-contain" />
    </div>
  );
}
