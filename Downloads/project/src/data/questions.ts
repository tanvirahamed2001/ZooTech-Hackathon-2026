import { Question } from '../types';

export const questions: Question[] = [
  {
    id: 1,
    scenario: "You need to assemble some flat-pack furniture that looks suspiciously like a puzzle designed by a mischievous gnome. The instructions are... well, let's call them \"minimalist.\" What's your first move?",
    options: [
      {
        id: '1V',
        text: "You hunt down a video tutorial online. Seeing someone else wrestle with it first is essential.",
        type: 'V'
      },
      {
        id: '1A',
        text: "You groan, then bribe a friend to talk you through it while you both question your life choices.",
        type: 'A'
      },
      {
        id: '1R',
        text: "You spread out the paper instructions (all six pages of diagrams!) and meticulously read every single step, possibly with a highlighter.",
        type: 'R'
      },
      {
        id: '1K',
        text: "Instructions? Please. You dive right in, figuring it out by trial, error, and maybe a few leftover screws you hope weren't important.",
        type: 'K'
      }
    ]
  },
  {
    id: 2,
    scenario: "You're trying to learn a fancy new recipe to impress someone (or just yourself, no judgment). How do you tackle it?",
    options: [
      {
        id: '2V',
        text: "You need visuals! Pictures of each step, or better yet, a cooking show video where they make it look effortless.",
        type: 'V'
      },
      {
        id: '2A',
        text: "You prefer listening to the recipe explained, maybe on a podcast or having someone dictate it as you go.",
        type: 'A'
      },
      {
        id: '2R',
        text: "You print out the recipe, read it thoroughly, make notes in the margins, and double-check ingredient lists.",
        type: 'R'
      },
      {
        id: '2K',
        text: "You get hands-on immediately. Measuring cups are suggestions, right? You learn best by doing (and tasting).",
        type: 'K'
      }
    ]
  },
  {
    id: 3,
    scenario: "Someone asks you for directions in a place you know reasonably well. How do you guide this lost soul?",
    options: [
      {
        id: '3V',
        text: "You instinctively start drawing a map on a napkin or gesturing wildly, pointing out landmarks.",
        type: 'V'
      },
      {
        id: '3A',
        text: "You give clear, spoken step-by-step instructions: \"Go left at the weird statue, then right after you hear the faint sound of despair...\"",
        type: 'A'
      },
      {
        id: '3R',
        text: "You write down the directions, complete with street names and maybe even little arrows.",
        type: 'R'
      },
      {
        id: '3K',
        text: "You say, \"Follow me!\" and physically walk them at least part of the way, or mime the turns.",
        type: 'K'
      }
    ]
  },
  {
    id: 4,
    scenario: "You've got a big presentation coming up. Forget the content for a second – how are you *really* preparing to deliver it smoothly?",
    options: [
      {
        id: '4V',
        text: "You create visually appealing slides with charts, images, and minimal text. It's all about the visual flow.",
        type: 'V'
      },
      {
        id: '4A',
        text: "You rehearse out loud, maybe recording yourself to catch the rhythm and tone. You might even talk it through with your pet goldfish.",
        type: 'A'
      },
      {
        id: '4R',
        text: "You write out detailed notes or even a full script. Having the words in front of you is comforting.",
        type: 'R'
      },
      {
        id: '4K',
        text: "You practice by pacing around the room, using hand gestures, and physically running through the motions of the presentation.",
        type: 'K'
      }
    ]
  },
  {
    id: 5,
    scenario: "You're picking up a new skill, say, learning basic guitar chords. What's your jam?",
    options: [
      {
        id: '5V',
        text: "Watching video lessons where you can see finger placements clearly.",
        type: 'V'
      },
      {
        id: '5A',
        text: "Listening intently to the sound of the chords, maybe using an app that plays them back, or having a teacher guide you by ear.",
        type: 'A'
      },
      {
        id: '5R',
        text: "Using chord diagrams, sheet music, or written tutorials explaining the theory and finger positions.",
        type: 'R'
      },
      {
        id: '5K',
        text: "Just grabbing the guitar and trying to mimic shapes and sounds, getting the feel for it through practice and muscle memory.",
        type: 'K'
      }
    ]
  },
  {
    id: 6,
    scenario: "You're in a meeting or lecture, and important information is being shared. How do you make sure it sticks?",
    options: [
      {
        id: '6V',
        text: "You're drawn to diagrams, charts, or mind maps shown. If the speaker uses visuals, you're golden.",
        type: 'V'
      },
      {
        id: '6A',
        text: "You focus intently on listening, catching nuances in tone. You might even repeat key phrases quietly to yourself.",
        type: 'A'
      },
      {
        id: '6R',
        text: "You're taking detailed notes, maybe even transcribing large parts of what's being said or written.",
        type: 'R'
      },
      {
        id: '6K',
        text: "You need to *do* something. Doodling related concepts, fidgeting slightly, or imagining applying the information helps you focus.",
        type: 'K'
      }
    ]
  },
  {
    id: 7,
    scenario: "You need to remember someone's phone number. Just saying \"put it in your contacts\" is cheating. How does your brain attempt this heroic feat?",
    options: [
      {
        id: '7V',
        text: "You visualize the numbers written down or on a keypad.",
        type: 'V'
      },
      {
        id: '7A',
        text: "You say the number out loud, maybe in a sing-song rhythm.",
        type: 'A'
      },
      {
        id: '7R',
        text: "You write the number down. Multiple times. On different surfaces.",
        type: 'R'
      },
      {
        id: '7K',
        text: "You practice dialing the number on your phone or keypad.",
        type: 'K'
      }
    ]
  },
  {
    id: 8,
    scenario: "You're planning a trip. Forget budget airlines for a sec, how are you figuring out what to *do* there?",
    options: [
      {
        id: '8V',
        text: "You're scrolling through travel photos, watching vlogs, looking at maps and brochures.",
        type: 'V'
      },
      {
        id: '8A',
        text: "You're listening to travel podcasts, talking to friends who've been there, soaking up stories and recommendations.",
        type: 'A'
      },
      {
        id: '8R',
        text: "You're reading travel guides, blogs, articles, and making detailed lists of sights and restaurants.",
        type: 'R'
      },
      {
        id: '8K',
        text: "You're looking at interactive maps, maybe doing a virtual tour, or focusing on activities like hikes, cooking classes, or workshops you can physically participate in.",
        type: 'K'
      }
    ]
  },
  {
    id: 9,
    scenario: "Okay, tech wizard. There's a new app everyone's raving about, promising to organize your sock drawer via Bluetooth (don't ask). How do you figure this thing out?",
    options: [
      {
        id: '9V',
        text: "Watch the official demo videos or look for screenshot tutorials. Seeing is believing... or at least understanding.",
        type: 'V'
      },
      {
        id: '9A',
        text: "Listen to a podcast review explaining its features or have a tech-savvy friend walk you through it over the phone.",
        type: 'A'
      },
      {
        id: '9R',
        text: "Dive into the user manual, FAQs, or online help articles. You need the written word!",
        type: 'R'
      },
      {
        id: '9K',
        text: "Just start tapping buttons and exploring menus. You learn by doing, even if it means accidentally ordering 100 pairs of argyle socks.",
        type: 'K'
      }
    ]
  },
  {
    id: 10,
    scenario: "You're at a gathering, meeting a dozen new people whose names instantly try to escape your brain. What's your strategy to avoid calling everyone \"buddy\"?",
    options: [
      {
        id: '10V',
        text: "You try to associate their face with their name, maybe visualizing the name written on their forehead (discreetly, of course).",
        type: 'V'
      },
      {
        id: '10A',
        text: "You repeat their name back to them when introduced and try to use it in conversation soon after. Hearing it helps.",
        type: 'A'
      },
      {
        id: '10R',
        text: "You discreetly jot down names and maybe a defining feature (\"Dave - loud shirt\") on your phone or a napkin.",
        type: 'R'
      },
      {
        id: '10K',
        text: "You rely on a firm handshake and try to connect the name to the physical interaction or the context of how you met them.",
        type: 'K'
      }
    ]
  },
  {
    id: 11,
    scenario: "Decision time! You and your friends are hungry, bordering on hangry. How do you usually pick a place to eat?",
    options: [
      {
        id: '11V',
        text: "You scroll through food pics online, look at photos of the restaurant's ambiance, or check out its menu design.",
        type: 'V'
      },
      {
        id: '11A',
        text: "You rely on word-of-mouth recommendations, listen to friends debate options, or call the restaurant to ask about specials.",
        type: 'A'
      },
      {
        id: '11R',
        text: "You read online reviews, check detailed menu descriptions, or compare written lists of pros and cons for different places.",
        type: 'R'
      },
      {
        id: '11K',
        text: "You prefer places you've physically been to before, or you might suggest walking around to see what looks good in person.",
        type: 'K'
      }
    ]
  },
  {
    id: 12,
    scenario: "Something went wrong – maybe a delivery was incorrect, or a service wasn't up to par. How do you typically approach resolving it?",
    options: [
      {
        id: '12V',
        text: "You prefer to see evidence, like photos of the issue, or use a live video chat if possible to show the problem.",
        type: 'V'
      },
      {
        id: '12A',
        text: "You want to talk it through on the phone or in person, explaining the situation and listening to the response.",
        type: 'A'
      },
      {
        id: '12R',
        text: "You write a detailed email or letter outlining the problem, referencing order numbers and dates. You want a written record.",
        type: 'R'
      },
      {
        id: '12K',
        text: "You might physically take the item back to the store or prefer a face-to-face interaction to demonstrate the issue.",
        type: 'K'
      }
    ]
  },
  {
    id: 13,
    scenario: "The day has beaten you up a bit. How do you typically unwind and recharge your batteries?",
    options: [
      {
        id: '13V',
        text: "Watching a movie, scrolling through visually pleasing social media, or looking at art/photography.",
        type: 'V'
      },
      {
        id: '13A',
        text: "Listening to music, a podcast, an audiobook, or just enjoying some peace and quiet.",
        type: 'A'
      },
      {
        id: '13R',
        text: "Reading a book, catching up on news articles, or writing in a journal.",
        type: 'R'
      },
      {
        id: '13K',
        text: "Engaging in a physical activity like exercise, cooking, gardening, crafting, or taking a long bath.",
        type: 'K'
      }
    ]
  }
];