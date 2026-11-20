import Image from "next/image";

/** Andy: the ANDACTION guitarist. `waving` swaps in the pose with the raised hand. */
export default function AndyMascot({
  className = "h-28 w-auto",
  waving = false,
}: {
  className?: string;
  waving?: boolean;
  /** Kept for old callers; the picture is already a head-and-shoulders crop. */
  head?: boolean;
}) {
  return waving ? (
    <Image src="/andy/andy-wave.png" alt="" width={389} height={346} unoptimized className={`object-contain ${className}`} />
  ) : (
    <Image src="/andy/andy.png" alt="" width={319} height={339} unoptimized className={`object-contain ${className}`} />
  );
}
