import {route, useRouter} from 'sanity/router'
import type {DocumentActionComponent, Tool} from 'sanity'
import {StudioReviewManager} from './ReviewManager'

export function ReviewsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M4 4h16v12H9l-5 4V4Z" />
      <path d="m12 6 1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-2 2.8-.4L12 6Z" />
    </svg>
  )
}
function ReviewsTool() {
  const {state} = useRouter()
  return (
    <StudioReviewManager initialItemId={typeof state.itemId === 'string' ? state.itemId : 'all'} />
  )
}
export function ReviewsSidebar() {
  return <StudioReviewManager />
}
export const reviewsTool: Tool = {
  name: 'reviews',
  title: 'Відгуки',
  icon: ReviewsIcon,
  component: ReviewsTool,
  router: route.create('/', [route.create('/:itemId')]),
  canHandleIntent: (intent) => intent === 'reviews',
  getIntentState: (_intent, params) => ({itemId: params.itemId || 'all'}),
}
export const OpenProductReviews: DocumentActionComponent = (props) => {
  const router = useRouter()
  return {
    label: 'Відгуки цього товару',
    icon: ReviewsIcon,
    onHandle: () => {
      router.navigateIntent('reviews', {itemId: props.id.replace(/^drafts\./, '')})
      props.onComplete()
    },
  }
}
