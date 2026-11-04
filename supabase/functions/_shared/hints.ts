// Server-only paid hints. Do not import from client modules.
export const paidHints: Record<number, string[]> = {
  1: [
    "Aarya hid a note somewhere the rendered page cannot show.",
    "The browser can show you the original HTML document. A Source mirror is also available here.",
    "Search the original markup for an archive access marker. The word beside it is your key.",
  ],
  2: [
    "The strange letters are a representation of ordinary text.",
    "Base64 groups bytes into printable characters. This workspace includes a decoder.",
    "Copy the entire transmission into the decoder, including its trailing equals sign.",
  ],
  3: [
    "Only deleted records can contradict a deletion timestamp.",
    "A last-seen timestamp after a deletion is impossible under this archive’s rules.",
    "Open both the readable and raw record views. Compare dates first, then times. Submit the record ID, not the student name.",
  ],
  4: [
    "Use help to discover the commands, then list the root directories.",
    "The logs, archive, and classified directories each preserve a fragment. Use cat with a full file path.",
    "Each fragment carries a number. Arrange the three recovered words by those numbers.",
  ],
  5: [
    "Read each evidence card’s timestamp rather than its position on the board.",
    "Compare hours, then minutes. They all happened on the same UTC date.",
    "Use the up and down controls to move cards. Begin with the earliest timestamp and end with the latest.",
  ],
  6: [
    "The evidence journal contains the original identity card.",
    "Find the Student ID field on the deleted identity evidence.",
    "Enter the identifier exactly as printed on the recovered card, including the hyphen.",
  ],
};
