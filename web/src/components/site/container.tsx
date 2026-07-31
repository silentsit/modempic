import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10", className)} {...props} />;
}
