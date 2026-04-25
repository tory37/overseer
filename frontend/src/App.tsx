import { useState, useEffect } from 'react'
import { PersonaLayout } from './components/PersonaLayout'
import { NewSessionOverlay } from './components/NewSessionOverlay'
import { getBaseUrl, createSession, deleteSession, type Persona, getPersonas } from './utils/api'

interface Tab {
  id: string;
  type: 'agent';
  name: string;
  cwd?: string;
  command?: string;
  personaId?: string | null;
  active: boolean;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/sessions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const agentTabs = data
            .filter((t: Tab) => !t.type || t.type === 'agent')
            .map((t: Tab) => ({ ...t, type: 'agent' as const }))
          setTabs(agentTabs)
        }
        setIsLoaded(true)
      })
      .catch(err => {
        console.error('Failed to fetch sessions:', err)
        setIsLoaded(true)
      })

    getPersonas()
      .then(setPersonas)
      .catch(err => console.error('Failed to fetch personas:', err))
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    fetch(`${getBaseUrl()}/api/sessions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tabs),
    }).catch(err => console.error('Failed to sync sessions:', err))
  }, [tabs])

  const openTab = async (name: string, path: string, command: string = '', personaId: string | null = null) => {
    try {
      const session = await createSession(name, path, command, personaId, 24, 80)
      const id = session.id
      setTabs(prev => [...prev.map(t => ({ ...t, active: false })), { id, type: 'agent', name, cwd: path, command, personaId, active: true }])
    } catch (err) {
      console.error('Failed to create session:', err)
      const id = Math.random().toString(36).substring(7)
      setTabs(prev => [...prev.map(t => ({ ...t, active: false })), { id, type: 'agent', name, cwd: path, command, personaId, active: true }])
    } finally {
      setIsCreatingSession(false)
      setIsLoaded(true)
    }
  }

  const closeSession = (id: string) => {
    setTabs(prev => prev.filter(t => t.id !== id))
    setIsLoaded(true)
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id)
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
    setTabs(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      <PersonaLayout
        tabs={tabs}
        personas={personas}
        onPersonaCreated={() => getPersonas().then(setPersonas)}
        onNewSession={() => setIsCreatingSession(true)}
        onCloseSession={closeSession}
        onDeleteSession={handleDeleteSession}
      />
      {isCreatingSession && (
        <NewSessionOverlay
          personas={personas}
          onClose={() => setIsCreatingSession(false)}
          onLaunch={(name: string, path: string, command: string, personaId: string | null) => openTab(name, path, command, personaId)}
        />
      )}
    </>
  )
}

export default App
