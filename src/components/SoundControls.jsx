import { SpeakerHigh, SpeakerSlash, MusicNotes } from '@phosphor-icons/react'
import { useSoundSettings } from '../lib/sound'

function SoundControls() {
  const { sfxOn, musicOn, toggleSfx, toggleMusic } = useSoundSettings()
  return (
    <>
      <button
        className="icon-btn"
        onClick={toggleMusic}
        aria-label={musicOn ? 'Mute music' : 'Unmute music'}
        style={{ opacity: musicOn ? 1 : 0.4 }}
      >
        <MusicNotes size={18} weight="fill" />
      </button>
      <button
        className="icon-btn"
        onClick={toggleSfx}
        aria-label={sfxOn ? 'Mute sound effects' : 'Unmute sound effects'}
      >
        {sfxOn ? <SpeakerHigh size={18} weight="fill" /> : <SpeakerSlash size={18} weight="fill" />}
      </button>
    </>
  )
}

export default SoundControls