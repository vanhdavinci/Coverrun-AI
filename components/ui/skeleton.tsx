import { cn } from "@/lib/utils"

const Skeleton: React.FC<{
  className,
  ...props
}> = ({
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props} />
  );
}

export { Skeleton }
