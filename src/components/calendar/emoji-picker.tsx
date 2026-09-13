"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const COMMON_EMOJIS = [
  "🎉", "🥳", "🎊", "🎈", "🎁", "🎂",
  "😊", "😎", "🥰", "🤔", "😴", "🤒",
  "💰", "💸", "💳", "🛒", "🛍️", "💎",
  "🍔", "🍕", "🌮", "🥗", "🍣", "☕",
  "🍺", "🍷", "🥂", "🍸", "🍹", "🍻",
  "🚗", "✈️", "🚂", "🚲", "⛵", "🚀",
  "🏠", "🏢", "🏥", "🏦", "🏨", "🏫",
  "🎮", "🎬", "🎵", "📚", "🎨", "⚽",
  "🏃", "🏋️", "🧘", "🏊", "🧗", "🚴",
  "☀️", "🌧️", "❄️", "🔥", "💧", "⚡",
  "💻", "📱", "⌚", "📷", "💡", "🛠️",
  "🐶", "🐱", "🐾", "🌹", "🌻", "🌲"
]

interface EmojiPickerProps {
  selectedEmoji: string | null
  onSelect: (emoji: string | null) => void
}

export function EmojiPicker({ selectedEmoji, onSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState("")

  // Simple filter - in a real app you'd map emojis to keywords
  // Here we're just keeping it simple for the subset
  const filteredEmojis = search 
    ? COMMON_EMOJIS.filter(e => e.includes(search)) // Won't do much without keywords, but keeps interface clean
    : COMMON_EMOJIS

  return (
    <div className="w-[280px] flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      
      <ScrollArea className="h-[200px] w-full pr-4">
        <div className="grid grid-cols-6 gap-1">
          {filteredEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className={`h-9 w-9 p-0 text-xl hover:bg-accent ${selectedEmoji === emoji ? 'bg-accent border border-primary/50' : ''}`}
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {selectedEmoji && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-8"
          onClick={() => onSelect(null)}
        >
          <X className="h-3 w-3 mr-1" /> Remove Emoji
        </Button>
      )}
    </div>
  )
}
