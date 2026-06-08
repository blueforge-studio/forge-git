import { Server, Key } from 'lucide-react'

interface Props {
  baseUrl: string
  maskedToken: string
}

export default function ConnectionInfo({ baseUrl, maskedToken }: Props) {
  return (
    <div className="border border-border rounded-lg p-6">
      <h3 className="text-sm font-semibold mb-3">Connection</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Server className="w-4 h-4 text-muted-foreground" />
          <dt className="text-muted-foreground w-24">Gitea URL</dt>
          <dd className="font-mono text-xs">{baseUrl}</dd>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Key className="w-4 h-4 text-muted-foreground" />
          <dt className="text-muted-foreground w-24">Token</dt>
          <dd className="font-mono text-xs">{maskedToken}</dd>
        </div>
      </div>
    </div>
  )
}
