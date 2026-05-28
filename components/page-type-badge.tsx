import {
  BookOpen,
  Clock,
  Gauge,
  HelpCircle,
  LayoutGrid,
  Newspaper,
  Package,
  Scale,
  ShoppingBag,
  Star,
  Tag,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { PAGE_TYPE_LABELS, type PageType } from "@/types/score"

const PAGE_TYPE_ICONS: Record<PageType, LucideIcon> = {
  news: Newspaper,
  review: Star,
  comparison: Scale,
  bestListicle: Trophy,
  pdpSpecsPrice: Package,
  howToTutorial: BookOpen,
  benchmarkTesting: Gauge,
  factFaq: HelpCircle,
  buyingGuide: ShoppingBag,
  timelineHistory: Clock,
  dealOffer: Tag,
  categoryCatalog: LayoutGrid,
  toolUtility: Wrench,
}

export function PageTypeBadge({ pageType }: { pageType: PageType }) {
  const Icon = PAGE_TYPE_ICONS[pageType]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {PAGE_TYPE_LABELS[pageType]}
    </span>
  )
}
