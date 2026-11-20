import AndyMascot from "./AndyMascot";

export default function AndyAvatar({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] p-[2px] ${className}`}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#121214]">
        <AndyMascot className="h-[86%] w-auto" />
      </span>
    </span>
  );
}
