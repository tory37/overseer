import { Panel, Group, Separator } from 'react-resizable-panels'
import { Terminal } from './Terminal'
import { UtilityPane } from './UtilityPane'
import { useState, useCallback, useRef, useEffect } from 'react'
import { PixelAgent } from './PixelAgent'
import type { Persona } from '../utils/api'

interface TabContainerProps {
  id: string
  cwd?: string
  command?: string
  personaId?: string | null
  personas: Persona[]
  onPersonaCreated?: () => void
}

export const TabContainer = ({ id, cwd, command, personaId, personas, onPersonaCreated }: TabContainerProps) => {
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleVoiceMessage = useCallback((message: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    setVoiceMessage(message)
    
    // Set a new timeout to clear the message after 8 seconds
    timeoutRef.current = setTimeout(() => {
      setVoiceMessage(null)
      timeoutRef.current = null
    }, 8000)
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const activePersona = personas.find(p => p.id === personaId)
  const avatarId = activePersona?.avatarId || 'overseer'
  const personaName = activePersona?.name || 'Overseer'

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <Group orientation="horizontal">
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full w-full bg-black/20 relative"> {/* Added relative for PixelAgent positioning */}
            <Terminal id={id} cwd={cwd} command={command} personaId={personaId} onVoiceMessage={handleVoiceMessage} />
            <PixelAgent message={voiceMessage} avatarId={avatarId} personaName={personaName} /> {/* Render PixelAgent with correct avatar and name */}
          </div>
        </Panel>
        
        <Separator className="w-1.5 bg-slate-900 border-x border-slate-800/50 hover:bg-blue-600/50 transition-all cursor-col-resize flex items-center justify-center group">
          <div className="w-[1px] h-8 bg-slate-700 group-hover:bg-blue-400 transition-colors"></div>
        </Separator>
        
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full w-full bg-slate-950/50 border-l border-slate-900">
            <UtilityPane id={id} cwd={cwd} onVoiceMessage={handleVoiceMessage} onPersonaCreated={onPersonaCreated} />
          </div>
        </Panel>
      </Group>
    </div>
  )
}
