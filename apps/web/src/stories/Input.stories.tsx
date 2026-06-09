import type { Meta, StoryObj } from '@storybook/react'
import { Input, Label } from '@forge-git/ui'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  args: { placeholder: 'Enter text...' },
  argTypes: {
    disabled: { control: 'boolean' },
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'search'] },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const Email: Story = { args: { type: 'email', placeholder: 'you@example.com' } }

export const Password: Story = { args: { type: 'password', placeholder: '••••••••' } }

export const Number: Story = { args: { type: 'number', placeholder: '42' } }

export const Disabled: Story = { args: { disabled: true, value: 'Disabled input' } }

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...args} />
    </div>
  ),
  args: { type: 'email', placeholder: 'you@example.com' },
}
