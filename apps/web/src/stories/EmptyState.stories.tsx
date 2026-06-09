import type { Meta, StoryObj } from '@storybook/react'
import EmptyState from '@/components/empty-state'
import { FolderOpen, Search, Package } from 'lucide-react'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const NoRepositories: Story = {
  args: {
    icon: FolderOpen,
    title: 'No repositories',
    description: 'You have not created any repositories yet.',
    actionLabel: 'New Repository',
    actionHref: '/repositories/new',
  },
}

export const NoResults: Story = {
  args: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search query or filters.',
    actionLabel: 'Clear filters',
    actionHref: '/search',
  },
}

export const WithoutAction: Story = {
  args: {
    icon: Package,
    title: 'Nothing here',
    description: 'This area is empty. Check back later.',
  },
}
