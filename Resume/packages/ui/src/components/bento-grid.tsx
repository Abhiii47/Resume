import { cn } from "../lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-[var(--radius)] group/bento transition duration-200 p-8 bg-[var(--bg)] border-2 border-[var(--fg)] hover:bg-[var(--bg-muted)] justify-between flex flex-col space-y-6",
        className,
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200">
        {icon}
        <div className="font-sans font-bold text-[var(--fg)] mb-1 mt-2 tracking-tight">
          {title}
        </div>
        <div className="font-sans font-normal text-[var(--fg-muted)] text-xs leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
