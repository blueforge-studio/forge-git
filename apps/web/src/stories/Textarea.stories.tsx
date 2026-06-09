import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from '@forge-git/ui'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  args: { placeholder: 'Write something...' },
  argTypes: { disabled: { control: 'boolean' } },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}

export const Disabled: Story = { args: { disabled: true, value: 'This textarea is disabled.' } }

export const WithContent: Story = {
  args: {
    defaultValue: 'This is the first line.\nThis is the second line.\n\nMarkdown is supported.',
    rows: 6,
  },
}

export const Wide: Story = {
  args: {
    placeholder: 'This one stretches full width...',
    className: 'w-full',
  },
  decorators: [(Story) => <div className="max-w-lg"><Story /></div>],
}
