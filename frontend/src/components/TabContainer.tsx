import { Panel, Group, Separator } from 'react-resizable-panels'
import { Terminal } from './Terminal'
import { UtilityPane } from './UtilityPane'

interface TabContainerProps {
  cwd?: string
}

export const TabContainer = ({ cwd }: TabContainerProps) => {
  return (
    <div className="flex-1 w-full h-full overflow-hidden">
      <Group orientation="horizontal">
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full w-full">
            <Terminal cwd={cwd} />
          </div>
        </Panel>
        
        <Separator className="w-1 bg-slate-800 hover:bg-blue-500/50 transition-colors cursor-col-resize" />
        
        <Panel defaultSize={40} minSize={20}>
          <UtilityPane cwd={cwd} />
        </Panel>
      </Group>
    </div>
  )
}
