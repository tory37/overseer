import { Panel, Group, Separator } from 'react-resizable-panels'
import { Terminal, type TerminalHandle } from './Terminal'
import { UtilityPane } from './UtilityPane'
import { useState, useCallback, useRef } from 'react'
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

export interface VoiceMessage {
  id: string
  text: string
  timestamp: number
  sender: 'agent' | 'user'
  isStreaming?: boolean
}

export const TabContainer = ({ id, cwd, command, personaId, personas, onPersonaCreated }: TabContainerProps) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [isWorking, setIsWorking] = useState(false)
  const terminalRef = useRef<TerminalHandle>(null)

  const handleVoiceMessage = useCallback((text: string, msgId?: string) => {
    setMessages(prev => {
      const id = msgId || 'default';
      const existingIndex = prev.findIndex(m => m.id === id);
      
      if (existingIndex !== -1) {
        const newMessages = [...prev];
        newMessages[existingIndex] = {
          ...newMessages[existingIndex],
          text,
          timestamp: Date.now(),
        };
        return newMessages;
      }
      
      return [...prev, {
        id,
        text,
        timestamp: Date.now(),
        sender: 'agent'
      }];
    });
  }, [])

  const handleActivity = useCallback((working: boolean) => {
    setIsWorking(working)
  }, [])

  const handleSendMessage = useCallback((text: string) => {
    // Add to local history
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      text,
      timestamp: Date.now(),
      sender: 'user'
    }])

    // Send to terminal with Carriage Return + Line Feed (Enter)
    terminalRef.current?.sendInput(text + '\r\n')
  }, [])

  const activePersona = personas.find(p => p.id === personaId)
  const avatarId = activePersona?.avatarId || 'overseer'
  const personaName = activePersona?.name || 'Overseer'

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <Group orientation="horizontal">
        {/* Panel 1: Agent Chat */}
        <Panel defaultSize={30} minSize={20}>
          <div className="h-full w-full bg-slate-950 border-r border-slate-900 flex flex-col">
            <PixelAgent 
              messages={messages} 
              isWorking={isWorking}
              avatarId={avatarId} 
              personaName={personaName} 
              onSendMessage={handleSendMessage}
            />
          </div>
        </Panel>

        <Separator className="w-1.5 bg-slate-900 border-x border-slate-800/50 hover:bg-blue-600/50 transition-all cursor-col-resize flex items-center justify-center group">
          <div className="w-[1px] h-8 bg-slate-700 group-hover:bg-blue-400 transition-colors"></div>
        </Separator>
        
        {/* Panel 2: Terminal */}
        <Panel defaultSize={40} minSize={30}>
          <div className="h-full w-full bg-black/20">
            <Terminal 
              ref={terminalRef}
              id={id} 
              cwd={cwd} 
              command={command} 
              personaId={personaId} 
              onVoiceMessage={handleVoiceMessage}
              onActivity={handleActivity}
            />
          </div>
        </Panel>
        
        <Separator className="w-1.5 bg-slate-900 border-x border-slate-800/50 hover:bg-blue-600/50 transition-all cursor-col-resize flex items-center justify-center group">
          <div className="w-[1px] h-8 bg-slate-700 group-hover:bg-blue-400 transition-colors"></div>
        </Separator>
        
        {/* Panel 3: Utility Pane */}
        <Panel defaultSize={30} minSize={20}>
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
      </Group>
    </div>
  )
}
