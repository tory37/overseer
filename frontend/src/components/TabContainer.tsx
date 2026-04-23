import { Panel, Group, Separator } from 'react-resizable-panels'
import { Terminal } from './Terminal'
import { UtilityPane } from './UtilityPane'
import { useState } from 'react'
import { PixelAgent } from './PixelAgent'

interface TabContainerProps {
  id: string
  cwd?: string
  command?: string
}

export const TabContainer = ({ id, cwd, command }: TabContainerProps) => {
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null)

  const handleVoiceMessage = (message: string) => {
    setVoiceMessage(message)
    // Optionally clear the message after some time
    setTimeout(() => setVoiceMessage(null), 5000); // Clear after 5 seconds
  }

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <Group orientation="horizontal">
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full w-full bg-black/20 relative"> {/* Added relative for PixelAgent positioning */}
            <Terminal id={id} cwd={cwd} command={command} onVoiceMessage={handleVoiceMessage} />
            <PixelAgent message={voiceMessage} avatarId="overseer" /> {/* Render PixelAgent */}
          </div>
        </Panel>
        
        <Separator className="w-1.5 bg-slate-900 border-x border-slate-800/50 hover:bg-blue-600/50 transition-all cursor-col-resize flex items-center justify-center group">
          <div className="w-[1px] h-8 bg-slate-700 group-hover:bg-blue-400 transition-colors"></div>
        </Separator>
        
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full w-full bg-slate-950/50 border-l border-slate-900">
            <UtilityPane cwd={cwd} />
          </div>
        </Panel>
      </Group>
    </div>
  )
}
