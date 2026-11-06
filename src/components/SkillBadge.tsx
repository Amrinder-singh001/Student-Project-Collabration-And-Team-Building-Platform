import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skillBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        primary: "border-primary/25 bg-primary/10 text-primary",
        accent: "border-accent/40 bg-accent/15 text-accent-foreground",
        outline: "border-border bg-transparent text-muted-foreground",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface SkillBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof skillBadgeVariants> {}

export function SkillBadge({ className, variant, size, ...props }: SkillBadgeProps) {
  return <span className={cn(skillBadgeVariants({ variant, size }), className)} {...props} />;
}

export function SkillBadgeList({
  skills,
  max,
  variant,
  className,
}: {
  skills: string[];
  max?: number;
  variant?: VariantProps<typeof skillBadgeVariants>["variant"];
  className?: string;
}) {
  const shown = max ? skills.slice(0, max) : skills;
  const rest = max ? skills.length - shown.length : 0;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((skill) => (
        <li key={skill}>
          <SkillBadge variant={variant}>{skill}</SkillBadge>
        </li>
      ))}
      {rest > 0 && (
        <li>
          <SkillBadge variant="outline">+{rest} more</SkillBadge>
        </li>
      )}
    </ul>
  );
}
