export const dummyMessages = [
  {
    id: 1, role: 'bot',
    text: "Hey, I'm Pyro — your safe space to think, feel, and just breathe. How are you doing today?",
    time: '10:02 AM', emotion: null,
  },
  {
    id: 2, role: 'user',
    text: "Honestly, not great. I've been feeling really overwhelmed lately with work and everything.",
    time: '10:03 AM', emotion: 'stressed',
  },
  {
    id: 3, role: 'bot',
    text: "That sounds really exhausting. Feeling overwhelmed is your mind's way of saying you need a moment. Can you tell me more about what's been happening?",
    time: '10:03 AM', emotion: null,
  },
  {
    id: 4, role: 'user',
    text: "There's just so much on my plate. Deadlines, relationships, barely sleeping. I feel like I'm failing at everything.",
    time: '10:05 AM', emotion: 'sad',
  },
  {
    id: 5, role: 'bot',
    text: "I hear you. Carrying all of that at once is genuinely hard — and feeling like you're failing doesn't mean you are. You're still here, still trying. That takes real courage.",
    time: '10:05 AM', emotion: null,
  },
]

export const emotionColors = {
  sad:      { label:'You seem sad',      color:'from-blue-400/20 to-indigo-400/10', text:'text-blue-300',   dot:'bg-blue-400'   },
  stressed: { label:'You seem stressed', color:'from-amber-400/20 to-orange-400/10', text:'text-amber-300', dot:'bg-amber-400'  },
  anxious:  { label:'You seem anxious',  color:'from-yellow-400/20 to-amber-400/10', text:'text-yellow-300',dot:'bg-yellow-400' },
  happy:    { label:'You seem happy',    color:'from-emerald-400/20 to-green-400/10',text:'text-emerald-300',dot:'bg-emerald-400'},
  tired:    { label:'You seem tired',    color:'from-purple-400/20 to-indigo-400/10',text:'text-purple-300', dot:'bg-purple-400' },
  calm:     { label:'You seem calm',     color:'from-cyan-400/20 to-teal-400/10',    text:'text-cyan-300',   dot:'bg-cyan-400'   },
}
