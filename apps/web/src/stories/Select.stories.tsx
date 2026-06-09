import type { Meta, StoryObj } from '@storybook/react'
import { Select } from '@forge-git/ui'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  args: {
    children: (
      <>
        <option value="">Choose an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </>
    ),
  },
  argTypes: { disabled: { control: 'boolean' } },
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {}

export const Disabled: Story = { args: { disabled: true } }

export const WithDefaultValue: Story = {
  args: {
    defaultValue: '2',
    children: (
      <>
        <option value="1">TypeScript</option>
        <option value="2">JavaScript</option>
        <option value="3">Python</option>
        <option value="4">Go</option>
        <option value="5">Rust</option>
      </>
    ),
  },
}
