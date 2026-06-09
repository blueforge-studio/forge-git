import type { Meta, StoryObj } from '@storybook/react'
import BuildStatusBadge from '@/components/build-status-badge'

const meta: Meta<typeof BuildStatusBadge> = {
  title: 'Components/BuildStatusBadge',
  component: BuildStatusBadge,
}

export default meta
type Story = StoryObj<typeof BuildStatusBadge>

export const Passing: Story = { args: { status: 'passing' } }

export const Failing: Story = { args: { status: 'failing' } }

export const Running: Story = { args: { status: 'running' } }

export const None: Story = { args: { status: 'none' } }
