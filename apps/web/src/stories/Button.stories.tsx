import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@forge-git/ui'
import { Mail, Plus, Trash2 } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Button' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'success', 'ghost', 'link'] },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Secondary: Story = { args: { variant: 'secondary' } }

export const Destructive: Story = { args: { variant: 'destructive' } }

export const Outline: Story = { args: { variant: 'outline' } }

export const Success: Story = { args: { variant: 'success' } }

export const Ghost: Story = { args: { variant: 'ghost' } }

export const Link: Story = { args: { variant: 'link' } }

export const Small: Story = { args: { size: 'sm' } }

export const Large: Story = { args: { size: 'lg' } }

export const Icon: Story = { args: { size: 'icon', children: <Plus className="w-4 h-4" />, 'aria-label': 'Add' } }

export const WithIcon: Story = { args: { children: <><Mail className="w-4 h-4 mr-2" /> Email</> } }

export const Loading: Story = { args: { disabled: true, children: 'Loading...' } }

export const AsChild: Story = {
  args: { asChild: true, children: <a href="/settings">Settings</a> },
}
