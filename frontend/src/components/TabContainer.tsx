import { Panel, Group, Separator } from 'react-resizable-panels'
import { Terminal } from './Terminal'
import { UtilityPane } from './UtilityPane'

interface TabContainerProps {
  cwd?: string
}

export const TabContainer = ({ cwd }: TabContainerProps) => {
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <Group orientation="horizontal">
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full w-full bg-black/20">
            <Terminal cwd={cwd} />
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
