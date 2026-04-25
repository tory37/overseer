import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { Terminal, type TerminalHandle } from './Terminal'
import { UtilityPane } from './UtilityPane'
import { MascotWidget } from './MascotWidget'
import { useState, useCallback, useRef } from 'react'
import type { Persona } from '../utils/api'
import { DEFAULT_AVATAR_CONFIG } from '../utils/api'
import type { AvatarConfig } from '../utils/api'

interface TabContainerProps {
  id: string
  cwd?: string
  command?: string
  personaId?: string | null
  personas: Persona[]
  onPersonaCreated?: () => void
}

export interface VoiceMessage {
  id: string
  text: string
  timestamp: number
  sender: 'agent' | 'user'
}

export const TabContainer = ({
  id,
  cwd,
  command,
  personaId,
  personas,
  onPersonaCreated,
}: TabContainerProps) => {
  // Only track the single latest voice message — mascot picks it up
  const [latestVoice, setLatestVoice] = useState<VoiceMessage | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const terminalRef = useRef<TerminalHandle>(null)

  const handleVoiceMessage = useCallback((text: string, msgId?: string) => {
    setLatestVoice({
      id: msgId || `voice-${Date.now()}`,
      text,
      timestamp: Date.now(),
      sender: 'agent',
    })
  }, [])

  const handleActivity = useCallback((working: boolean) => {
    setIsWorking(working)
  }, [])

  const activePersona = personas.find(p => p.id === personaId)
  const avatarConfig: AvatarConfig = activePersona?.avatarConfig ?? DEFAULT_AVATAR_CONFIG
  const personaName = activePersona?.name || 'Overseer'

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <PanelGroup orientation="horizontal">
        {/* Terminal — takes the full remaining space */}
        <Panel defaultSize={65} minSize={40}>
          {/* Relative container so MascotWidget can be absolutely positioned inside */}
          <div className="h-full w-full bg-black/20 relative">
            <Terminal
              ref={terminalRef}
              id={id}
              cwd={cwd}
              command={command}
              personaId={personaId}
              onVoiceMessage={handleVoiceMessage}
              onActivity={handleActivity}
            />

            {/* Mascot overlay — only shown when a persona is active */}
            {personaId && (
              <MascotWidget
                latestVoice={latestVoice}
                isWorking={isWorking}
                avatarConfig={avatarConfig}
                personaName={personaName}
              />
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-slate-900 border-x border-slate-800/50 hover:bg-blue-600/50 transition-all cursor-col-resize flex items-center justify-center group">
          <div className="w-[1px] h-8 bg-slate-700 group-hover:bg-blue-400 transition-colors" />
        </PanelResizeHandle>

        {/* Utility Pane */}
        <Panel defaultSize={35} minSize={20}>
          <div className="h-full w-full bg-slate-950/50 border-l border-slate-900">
            <UtilityPane
              id={id}
              cwd={cwd}
              onVoiceMessage={handleVoiceMessage}
              onActivity={handleActivity}
              onPersonaCreated={onPersonaCreated}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
