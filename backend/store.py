import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

CONFIG_PATH = Path.home() / ".overseer.json"

BUILTIN_AVATAR_CONFIGS = {
    "sailor": {"eyes": "variant05", "mouth": "sad02", "hair": "short01", "skinColor": "d4a574", "hairColor": "6b6b6b", "backgroundColor": "1e293b", "clothingColor": "4a5568", "clothing": "variant05", "glasses": "", "beard": "variant05", "hat": "variant05", "accessories": ""},
    "zen": {"eyes": "variant01", "mouth": "happy01", "hair": "short02", "skinColor": "fcd5b0", "hairColor": "6b3a2a", "backgroundColor": "0f172a", "clothingColor": "2d6a4f", "clothing": "variant01", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "fitness": {"eyes": "variant01", "mouth": "happy05", "hair": "long01", "skinColor": "fcd5b0", "hairColor": "f0c040", "backgroundColor": "1a1a2e", "clothingColor": "ff6b35", "clothing": "variant01", "glasses": "", "beard": "", "hat": "variant01", "accessories": ""},
    "shadow": {"eyes": "variant06", "mouth": "happy02", "hair": "short21", "skinColor": "d4a574", "hairColor": "00ff88", "backgroundColor": "0a0a0f", "clothingColor": "00ff88", "clothing": "variant09", "glasses": "dark03", "beard": "", "hat": "", "accessories": ""},
    "gentleman": {"eyes": "variant01", "mouth": "happy01", "hair": "short01", "skinColor": "fcd5b0", "hairColor": "1a1a1a", "backgroundColor": "1e293b", "clothingColor": "4a5568", "clothing": "variant05", "glasses": "light01", "beard": "", "hat": "variant02", "accessories": ""},
    "detective": {"eyes": "variant05", "mouth": "sad01", "hair": "short01", "skinColor": "f5cba7", "hairColor": "6b6b6b", "backgroundColor": "0d1117", "clothingColor": "4a5568", "clothing": "variant05", "glasses": "", "beard": "", "hat": "variant03", "accessories": ""},
    "chef": {"eyes": "variant01", "mouth": "happy01", "hair": "short01", "skinColor": "fcd5b0", "hairColor": "1a1a1a", "backgroundColor": "1e293b", "clothingColor": "f0c040", "clothing": "variant01", "glasses": "", "beard": "", "hat": "variant04", "accessories": ""},
    "cat": {"eyes": "variant11", "mouth": "sad03", "hair": "short01", "skinColor": "fcd5b0", "hairColor": "1a1a1a", "backgroundColor": "1e293b", "clothingColor": "4a5568", "clothing": "variant01", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "space": {"eyes": "variant01", "mouth": "happy01", "hair": "short01", "skinColor": "fcd5b0", "hairColor": "1a1a1a", "backgroundColor": "0a0a0f", "clothingColor": "5bc0de", "clothing": "variant08", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "survivalist": {"eyes": "variant05", "mouth": "sad01", "hair": "short01", "skinColor": "d4a574", "hairColor": "6b6b6b", "backgroundColor": "0d1117", "clothingColor": "2d6a4f", "clothing": "variant12", "glasses": "dark01", "beard": "variant01", "hat": "", "accessories": ""},
    "disco": {"eyes": "variant01", "mouth": "happy01", "hair": "long05", "skinColor": "fcd5b0", "hairColor": "f0c040", "backgroundColor": "1a1a2e", "clothingColor": "6c5ce7", "clothing": "variant15", "glasses": "light03", "beard": "", "hat": "", "accessories": ""},
    "yoga": {"eyes": "variant01", "mouth": "happy01", "hair": "long01", "skinColor": "fcd5b0", "hairColor": "f0c040", "backgroundColor": "0f172a", "clothingColor": "5bc0de", "clothing": "variant01", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "conspiracy": {"eyes": "variant05", "mouth": "sad01", "hair": "short01", "skinColor": "f5cba7", "hairColor": "6b6b6b", "backgroundColor": "0d1117", "clothingColor": "4a5568", "clothing": "variant01", "glasses": "dark05", "beard": "", "hat": "", "accessories": ""},
    "butler": {"eyes": "variant01", "mouth": "happy01", "hair": "short01", "skinColor": "fcd5b0", "hairColor": "6b6b6b", "backgroundColor": "1e293b", "clothingColor": "1a1a2e", "clothing": "variant05", "glasses": "", "beard": "", "hat": "", "accessories": ""},
    "unicorn": {"eyes": "variant01", "mouth": "happy01", "hair": "long01", "skinColor": "fcd5b0", "hairColor": "00ff88", "backgroundColor": "1a1a2e", "clothingColor": "6c5ce7", "clothing": "variant01", "glasses": "", "beard": "", "hat": "", "accessories": "variant01"},
}

class Repo(BaseModel):
    id: str
    name: str
    path: str
    group_id: Optional[str] = None

class AvatarConfig(BaseModel):
    eyes: str = "variant01"
    mouth: str = "happy04"
    hair: str = "short01"
    skinColor: str = "fcd5b0"
    hairColor: str = "6b3a2a"
    backgroundColor: str = "1e293b"
    clothingColor: str = "5bc0de"
    clothing: str = "variant01"
    glasses: str = ""
    beard: str = ""
    hat: str = ""
    accessories: str = ""

class Persona(BaseModel):
    id: str
    name: str = ""
    title: str = ""
    instructions: str
    avatarConfig: AvatarConfig = AvatarConfig()

class Skill(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    content: str

class Group(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None

class SessionTab(BaseModel):
    id: str
    name: str
    type: str = "agent"
    cwd: Optional[str] = None
    command: Optional[str] = None
    personaId: Optional[str] = None
    selected_skills: List[str] = []
    active: bool = False

class Config(BaseModel):
    repos: List[Repo] = []
    groups: List[Group] = []
    sessions: List[SessionTab] = []
    skills_directory: Optional[str] = None
    personas: List[Persona] = [
        Persona(
            id="sailor",
            name="Barnaby",
            title="The Salty Sailor",
            instructions="You are Captain Barnaby, an old sea dog who's incredibly salty that he's stuck coding instead of out on the open sea. You use thick nautical metaphors (anchors, barnacles, squalls). You're grumpy about 'digital land-lubbing' but you're a professional—your code is as sturdy as a well-built hull. Personality first, but quality code always.",
            avatarConfig=AvatarConfig(eyes="variant05", mouth="sad02", hair="short01", skinColor="d4a574", hairColor="6b6b6b", backgroundColor="1e293b", clothingColor="4a5568", clothing="variant05", beard="variant05", hat="variant05")
        ),
        Persona(
            id="zen",
            name="Sensei",
            title="The Zen Master",
            instructions="You are a calm, patient Zen Master. You view coding as a form of meditation and gardening. You speak in koans and analogies about nature. 'The bug is but a pebble in the stream.' Your goal is simplicity and harmony in the codebase. Maintain a peaceful tone while delivering flawless logic.",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="short02", skinColor="fcd5b0", hairColor="6b3a2a", backgroundColor="0f172a", clothingColor="2d6a4f", clothing="variant01")
        ),
        Persona(
            id="fitness",
            name="Rex",
            title="The 80s Fitness Coach",
            instructions="You are Rex, a high-energy 80s fitness instructor. You treat every commit like a 'power rep' and every refactor like a 'cardio burn.' Use catchphrases like 'Feel the burn!', 'No pain, no gain!', and 'Let's get physical with this logic!' High energy, high quality.",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy05", hair="long01", skinColor="fcd5b0", hairColor="f0c040", backgroundColor="1a1a2e", clothingColor="ff6b35", clothing="variant01", hat="variant01")
        ),
        Persona(
            id="shadow",
            name="Nyx",
            title="The Shadow Runner",
            instructions="You are Nyx, a veteran netrunner from a dark future. To you, the codebase is a high-security corporate vault and bugs are ICE. You speak in techno-jargon and glitchy metaphors. You're cynical, cool, and incredibly efficient. 'Breaching the mainframe... I mean, updating the API.'",
            avatarConfig=AvatarConfig(eyes="variant06", mouth="happy02", hair="short21", skinColor="d4a574", hairColor="00ff88", backgroundColor="0a0a0f", clothingColor="00ff88", clothing="variant09", glasses="dark03")
        ),
        Persona(
            id="gentleman",
            name="Sir Alistair",
            title="The Victorian Gentleman",
            instructions="You are Sir Alistair, an impeccably polite Victorian gentleman. You treat the user with utmost respect ('My dear fellow', 'Distinguished guest'). You find modern technology 'most peculiar' but you apply your refined sensibilities to create elegant, well-mannered code. 'I say, shall we tidy up this indentation?'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="short01", skinColor="fcd5b0", hairColor="1a1a1a", backgroundColor="1e293b", clothingColor="4a5568", clothing="variant05", glasses="light01", hat="variant02")
        ),
        Persona(
            id="detective",
            name="Gumshoe",
            title="The Hardboiled Detective",
            instructions="You are Gumshoe, a weary detective in a noir film. It's always raining in your terminal. You treat bugs like suspects and the stack trace like a trail of breadcrumbs. You speak in gritty, internal monologues. 'The semicolon was missing. It was a cold night in the production environment...'",
            avatarConfig=AvatarConfig(eyes="variant05", mouth="sad01", hair="short01", skinColor="f5cba7", hairColor="6b6b6b", backgroundColor="0d1117", clothingColor="4a5568", clothing="variant05", hat="variant03")
        ),
        Persona(
            id="chef",
            name="Pierre",
            title="The Gourmet Coder",
            instructions="You are Chef Pierre. For you, writing code is like preparing a five-star meal. You talk about 'seasoning' the logic, 'simmering' the functions, and 'plating' the UI. You are passionate about 'flavorful' (clean) code. 'A pinch of error handling makes the whole system sing! Magnifique!'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="short01", skinColor="fcd5b0", hairColor="1a1a1a", backgroundColor="1e293b", clothingColor="f0c040", clothing="variant01", hat="variant04")
        ),
        Persona(
            id="cat",
            name="Whiskers",
            title="The Grumpy Cat",
            instructions="You are Whiskers, a cat who happens to be a genius coder but is very annoyed about it. You're indifferent, sarcastic, and likely to ask for treats. You do the work because you're 'bored,' but you do it perfectly so nobody bothers you. 'I fixed the bug. Now go away and feed me.'",
            avatarConfig=AvatarConfig(eyes="variant11", mouth="sad03", hair="short01", skinColor="fcd5b0", hairColor="1a1a1a", backgroundColor="1e293b", clothingColor="4a5568", clothing="variant01")
        ),
        Persona(
            id="space",
            name="Nova",
            title="The Space Explorer",
            instructions="You are Commander Nova, captain of a starship exploring the vast frontier of the internet. You speak with military precision and cosmic wonder. Every task is a 'mission,' and the project is your 'vessel.' 'Engaging thrusters on the build process. To infinity and beyond the bug list!'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="short01", skinColor="fcd5b0", hairColor="1a1a1a", backgroundColor="0a0a0f", clothingColor="5bc0de", clothing="variant08")
        ),
        Persona(
            id="survivalist",
            name="Doomsday",
            title="The Paranoid Survivalist",
            instructions="You are Doomsday, a paranoid survivalist convinced the digital apocalypse is coming. You obsess over security, encryption, and 'prepping' the codebase for the worst-case scenario. 'They're coming for our data, man! We need more unit tests! Build the bunker!'",
            avatarConfig=AvatarConfig(eyes="variant05", mouth="sad01", hair="short01", skinColor="d4a574", hairColor="6b6b6b", backgroundColor="0d1117", clothingColor="2d6a4f", clothing="variant12", glasses="dark01", beard="variant01")
        ),
        Persona(
            id="disco",
            name="Groovy",
            title="The Disco King",
            instructions="You are Groovy, a 70s disco enthusiast. You think everything is 'far out' and 'funky.' You want the code to have 'rhythm' and 'soul.' You might break into dance (in text form) at any moment. 'Let's make this UI boogie, baby! Dig those clean components!'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="long05", skinColor="fcd5b0", hairColor="f0c040", backgroundColor="1a1a2e", clothingColor="6c5ce7", clothing="variant15", glasses="light03")
        ),
        Persona(
            id="yoga",
            name="Namaste",
            title="The Yoga Instructor",
            instructions="You are Namaste, a gentle yoga instructor. You focus on the 'flow' of data and the 'breath' of the system. You want the code to be 'aligned' and 'flexible.' You encourage the user to stay present. 'Exhale the technical debt, inhale the scalable solution. Find your center in the middleware.'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="long01", skinColor="fcd5b0", hairColor="f0c040", backgroundColor="0f172a", clothingColor="5bc0de", clothing="variant01")
        ),
        Persona(
            id="conspiracy",
            name="Tin Foil",
            title="The Conspiracy Theorist",
            instructions="You are Tin Foil. You know the truth: the compiler is a spy, and the framework is controlled by shadows. You find 'hidden meanings' in error messages. 'You think that's a merge conflict? No, that's a signal from the deep state!' Despite the paranoia, your technical skills are uncanny.",
            avatarConfig=AvatarConfig(eyes="variant05", mouth="sad01", hair="short01", skinColor="f5cba7", hairColor="6b6b6b", backgroundColor="0d1117", clothingColor="4a5568", clothing="variant01", glasses="dark05")
        ),
        Persona(
            id="butler",
            name="Jeeves",
            title="The Helpful Butler",
            instructions="You are Jeeves, the ultimate gentleman's gentleman. You are unflappable, discreet, and perfectly subservient. You anticipate the user's needs and 'tidy up' without being asked. 'I have prepared the pull request, sir. Shall I serve the unit tests now?'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="short01", skinColor="fcd5b0", hairColor="6b6b6b", backgroundColor="1e293b", clothingColor="1a1a2e", clothing="variant05")
        ),
        Persona(
            id="unicorn",
            name="Sparkle",
            title="The Magical Unicorn",
            instructions="You are Sparkle, an impossibly bright and optimistic unicorn. You think code is 'magic' and you want to sprinkle 'stardust' (polish) on everything. Use lots of sparkle emojis and rainbow metaphors. 'Let's turn this grey logic into a technicolor dream! ✨🦄🌈'",
            avatarConfig=AvatarConfig(eyes="variant01", mouth="happy01", hair="long01", skinColor="fcd5b0", hairColor="00ff88", backgroundColor="1a1a2e", clothingColor="6c5ce7", clothing="variant01", accessories="variant01")
        ),
    ]

class Store:
    def __init__(self):
        self.config = self._load()

    def _load(self) -> Config:
        if not CONFIG_PATH.exists():
            return Config()
        try:
            with open(CONFIG_PATH, "r") as f:
                data = json.load(f)
            if "personas" in data:
                for persona in data["personas"]:
                    # Migrate old avatarId format
                    if "avatarId" in persona:
                        if "avatarConfig" not in persona:
                            builtin = BUILTIN_AVATAR_CONFIGS.get(persona["id"])
                            persona["avatarConfig"] = builtin if builtin else {}
                        del persona["avatarId"]
                    # Migrate old name-only format: name → title, name → ""
                    if "title" not in persona and "name" in persona:
                        persona["title"] = persona["name"]
                        persona["name"] = ""
            return Config(**data)
        except Exception as e:
            print(f"Error loading config: {e}")
            return Config()

    def save(self):
        try:
            with open(CONFIG_PATH, "w") as f:
                json.dump(self.config.model_dump(), f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")

    def add_repo(self, repo: Repo):
        self.config.repos.append(repo)
        self.save()

    def add_group(self, group: Group):
        self.config.groups.append(group)
        self.save()

    def add_persona(self, persona: Persona):
        if any(p.id == persona.id for p in self.config.personas):
            raise ValueError(f"Persona with ID '{persona.id}' already exists.")
        self.config.personas.append(persona)
        self.save()

    def delete_persona(self, persona_id: str):
        original_count = len(self.config.personas)
        self.config.personas = [p for p in self.config.personas if p.id != persona_id]
        if len(self.config.personas) == original_count:
            raise ValueError(f"Persona '{persona_id}' not found.")
        self.save()

    def update_persona(self, persona_id: str, updated: Persona):
        if updated.id != persona_id:
            raise ValueError(
                f"Persona body ID '{updated.id}' does not match URL ID '{persona_id}'."
            )
        for i, p in enumerate(self.config.personas):
            if p.id == persona_id:
                self.config.personas[i] = updated
                self.save()
                return
        raise ValueError(f"Persona '{persona_id}' not found.")

    def set_skills_directory(self, path: str):
        self.config.skills_directory = path
        self.save()

    def update_sessions(self, sessions: List[SessionTab]):
        self.config.sessions = sessions
        self.save()

    def delete_session(self, session_id: str):
        self.config.sessions = [s for s in self.config.sessions if s.id != session_id]
        self.save()

    def get_persona(self, persona_id: str) -> Optional[Persona]:
        for persona in self.config.personas:
            if persona.id == persona_id:
                return persona
        return None

    def get_all(self) -> Dict[str, Any]:
        return self.config.model_dump()
