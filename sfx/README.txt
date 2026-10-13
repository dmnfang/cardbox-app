Cardbox v3 SFX pack - processed
-------------------------------
Same filenames as the originals, so they drop straight in.

What was done to every file
- Trimmed leading silence (kills tap latency) and trailing silence (adds a 30 ms fade-out so nothing clicks).
- Matched loudness by group: tiny UI sounds quietest, cue sounds mid, fanfares (Celebration, All_done) loudest.
- All peaks capped at -2 dBFS (the originals had several at or above 0 dBFS).
- Re-encoded as 160 kbps MP3. Each file keeps its original sample rate and channel count.

Loops (Lofi, Flashlight)
- Only the encoder padding was trimmed from each end. No crossfade, so the beat timing is untouched.
- Lofi: about -22 LUFS. Flashlight: raised about 8 dB, to about -29 LUFS.
- The 'fade' I first suspected at the end of each loop turned out to be the encoder's silence padding.

Not changed
- No creative edits, just trim, level and encode. Long sounds (Call wheel 10.9 s, Spell correct letter 2.1 s) are not shortened.
