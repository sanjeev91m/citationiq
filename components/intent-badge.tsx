import {
  ClipboardCheck,
  Info,
  MapPin,
  Newspaper,
  Scale,
  Search,
  ShoppingCart,
  ThumbsUp,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { INTENT_LABELS, type Intent } from "@/types/score"

const INTENT_ICONS: Record<Intent, LucideIcon> = {
  informational: Info,
  recommendation: ThumbsUp,
  comparison: Scale,
  evaluation: ClipboardCheck,
  transactional: ShoppingCart,
  specificFact: Search,
  freshnessNews: Newspaper,
  troubleshooting: Wrench,
  availability: MapPin,
}

export function IntentBadge({ intent }: { intent: Intent }) {
  const Icon = INTENT_ICONS[intent]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {INTENT_LABELS[intent]}
    </span>
  )
}
