import type { BasePost, CurrentlyBlock, PastLetter } from "./types";

const T = {
  musing: { label: "musing", tint: "lavender" } as const,
  short: { label: "short", tint: "butter" } as const,
  grief: { label: "grief", tint: "sage" } as const,
  phones: { label: "phones", tint: "slate" } as const,
  bangalore: { label: "bangalore", tint: "peach" } as const,
  family: { label: "family", tint: "butter" } as const,
  competence: { label: "competence", tint: "butter" } as const,
  humiliations: { label: "small humiliations", tint: "peach" } as const,
  love: { label: "love", tint: "peach" } as const,
};

/* ---------------- musings ---------------- */

export const musings: BasePost[] = [
  {
    slug: "why-i-cry-at-ads",
    type: "musing",
    number: 23,
    title: "Why I cry at ads but not at things *that matter*",
    dek: "It's the dad in the noodle commercial. It's never the friend's actual divorce. A theory about distance, another about shame, and an apology that arrived eight weeks too late.",
    body: `The first time I noticed it, I was thirty-one, alone, and the commercial was for a brand of instant noodles I have never bought and will never buy. A father walks his daughter to the bus stand on her first day at a hostel. She forgets her steel tiffin in the kitchen. He runs back, six floors, no lift, with the tiffin. She does not turn around. He stands there. The bus leaves. He stands there with the tiffin. I cried for forty seconds, then for another twenty when the jingle came back.

The same week, a friend I have known since 2009 told me his marriage was ending. We were sitting on the same side of a table at a coffee place near my house. I asked the correct questions. I felt the correct things, at the correct distance. I did not cry, then or later. I made a small, firm mental note to text him on Sunday, and then I did not text him on Sunday. I did not text him for a long time.

>>> The advertisement asked nothing of me except to be moved. The friend, somehow, asked *more.* :: — the working theory

There are *two theories*. The first one is about distance. The argument goes like this: the noodle dad lives at a perfectly safe distance from me. He is a fiction, a frame, a face inside a sixty-second box. I can pour grief into the box and the box does not pour anything back. The friend across the table is not in a box. The friend is two feet away. He has a life I can touch. If I cry, the crying becomes a thing in the room that he has to manage, on top of the marriage.

The second theory is about shame. It goes like this: I do not cry in front of the friend because, somewhere deep, I am ashamed that I am not crying. I do not feel *enough*, fast enough, and that absence itself is the thing I cannot let him see. So I keep my face still. I ask the correct questions. I run through the playbook I have practiced in *showers*, in autos, in stairwells, since I was twelve.

## A small, *uncharitable* aside

Neither theory makes me look good. The first one says I am only capable of feeling things when there is no risk attached to them. The second says I am performing my own emotional life in real time, and the performance is mostly designed to protect me from being seen as inadequate. Both of those can be true at once. I think they probably are.

[[ ↳ I would like a third, kinder theory, please. ]]

What I know for sure: eight weeks later, when I finally did text him, he wrote back, *"you took a while."* I wrote back, *"I'm sorry."* He wrote, *"it's okay."* I do not think it was okay. I think he was being generous, because that is the kind of person he is, and because the version of the friendship we both wanted to protect required, that day, a small lie.

I am still crying at advertisements. I do not think this is going to stop. Last week it was an insurance ad, of all things — a man with grey hair calling his mother about a leaking tap, but you understood, somehow, that the tap was not really what he was calling about. Forty seconds, then twenty more. *The tap was not really what he was calling about.*

I have not yet learned to call my own mother about *her* taps. I have learned, only, how to cry about a stranger's.

-- end`,
    tags: [T.musing, T.grief],
    publishedAt: new Date("2026-05-12T11:00:00Z"),
    featured: true,
    cardTint: "grief",
    readingTimeMinutes: 4,
  },
  {
    slug: "leaving-messages-on-read",
    type: "musing",
    number: 22,
    title: "On leaving messages on *read*",
    dek: "There are forty-one unanswered texts in my phone right now. I am not avoiding them. I am also not *not* avoiding them. This is the philosophy of *maybe*, applied to friendship.",
    body: `Forty-one. I counted, just now, because I was avoiding writing this essay, and also because counting them felt like a kind of partial reply.

The texts are not difficult, individually. A photo from a friend. A wedding invite. An old colleague checking in. The cousin who only ever texts on the third Sunday of the month, for reasons I have stopped asking about.

It is the *aggregate* that is difficult. Each one, on its own, is a small request: see me, respond to me, confirm that the small thread between us is still load-bearing. Forty-one of those, sitting unanswered, become a single very large request, with one's own conscience attached. I cannot answer the single very large request, because it is not a thing one can reply *to*.

So I leave them on read. Not as cruelty. As a small, quiet bargain: *I will get to it. I am not ignoring it. I am only*, *for the moment*, *holding the maybe.*

[[ ↳ this is the philosophy of *maybe*, applied to friendship. ]]

It used to bother me more than it does now. I am no longer sure that is a good thing.

-- end`,
    tags: [T.musing, T.phones],
    publishedAt: new Date("2026-05-04T11:00:00Z"),
    cardTint: "phones",
    readingTimeMinutes: 3,
  },
  {
    slug: "bangalore-auto-philosophy-of-maybe",
    type: "musing",
    number: 21,
    title: "Bangalore auto and the philosophy of *maybe*",
    dek: "The 8:47 auto-rickshaw didn't really say no, but it didn't say yes either, and somewhere inside that ambiguity I had to live for the next eleven minutes.",
    body: `The 8:47 auto-rickshaw, idling outside Brigade Road, did not say no when I asked for HSR. It did not say yes either. It tilted its head by perhaps four degrees, looked at a fixed point above my left shoulder, and made a small movement with its hand that could, depending on the kind of day I was having, have meant anything between *come on, get in* and *go away*, *I am thinking*.

I have lived here long enough to know that there are five distinct varieties of this gesture. There is the *gesture of ambient unwillingness*, in which the driver is, in principle, available, but would prefer that you find someone else. There is the *gesture of conditional acceptance*, in which the destination is fine but the meter is not. There is the *gesture of weather*, in which the auto exists in some abstract sense but the driver, today, does not.

I cannot reliably distinguish between any of these.

>>> Bangalore traffic is mostly weather; you don't ask the cloud whether it intends to rain. :: — a working theory of urban planning

I have come, over the years, to a small, quiet peace with this. The auto is not the obstacle. The *not-knowing* is the obstacle, and the not-knowing, it turns out, is the city itself.

You learn, eventually, to live inside the maybe. You learn to ask twice, gently, and to walk away without rancour the third time. You learn that the auto that finally agrees to take you, at 8:53, is not the same auto you tried at 8:47, and that the difference, somehow, is not just statistical.

[[ ↳ the city is the maybe. the auto is only the messenger. ]]

-- end`,
    tags: [T.musing, T.bangalore],
    publishedAt: new Date("2026-04-27T11:00:00Z"),
    cardTint: "bangal",
    readingTimeMinutes: 5,
  },
  {
    slug: "autocorrect-gaslighter",
    type: "musing",
    number: 20,
    title: "The autocorrect *gaslighter*",
    dek: "My phone has been telling me my own name is wrong for three years. I keep correcting it. It keeps correcting me back. Somewhere in here is a parable.",
    body: `For three years my phone has corrected my own first name to a slightly different first name, belonging to no one I know.

I have corrected it back, dozens of times, with the small red squiggle, with the long-press, with the *“add to dictionary”* dialog. The phone receives my correction with the air of a polite, patient person who is humouring me for now. Forty-eight hours later it suggests the wrong name again.

[[ ↳ I have been overruled, daily, by a feature designed to help me. ]]

There is something quietly comic about this. There is also something quietly *something else* about this — a small parable about which authority you let into your house, and which corrections you accept without noticing.

I keep correcting it. I will probably keep correcting it. Somewhere in here is a metaphor about the small, ambient ways one is asked to become someone else, in increments, by systems that do not, technically, mean any harm.

-- end`,
    tags: [T.musing, T.phones],
    publishedAt: new Date("2026-04-18T11:00:00Z"),
    cardTint: "phones",
    readingTimeMinutes: 3,
  },
  {
    slug: "performing-competence",
    type: "musing",
    number: 19,
    title: "I have been performing *competence* for fourteen years",
    dek: 'There is a version of me, in meetings, who knows what he is doing. He sits very still. He uses words like "directionally." I do not know him. I keep him alive for the sake of the household.',
    body: `There is a version of me, in meetings, who knows what he is doing.

He sits very still. He uses phrases like *"directionally yes"* and *"I want to push back gently here."* He nods at the right cadence. He produces, on demand, a follow-up email with three bullet points and a deadline, in a tone of voice that suggests the bullet points were arrived at after long, calm consideration.

I do not know him. I cannot find him outside of conference rooms. He is the person the household needs me to be, between 9:30 and 6:00, in exchange for the rent and the groceries and the small luxury of writing this essay on a Sunday night.

This is, mostly, fine. The performance is, on its better days, a kindness — to the team that needs a steady person in the meeting, to the partner who needs the rent paid, to the version of me at twenty-three who would not have believed any of this was possible.

It is just that I have been doing it for fourteen years now, and there are moments, late in the day, when I am no longer sure which of us is the *original*.

-- end`,
    tags: [T.musing, T.competence],
    publishedAt: new Date("2026-04-09T11:00:00Z"),
    cardTint: "musing",
    readingTimeMinutes: 6,
  },
  {
    slug: "things-i-almost-said",
    type: "musing",
    number: 18,
    title: "A list of things I *almost* said",
    dek: "To a stranger on the metro. To a colleague who took credit. To my father in 2014. To my father in 2023. To the boy at the chai stall who knows my order but not my name.",
    body: `*To the stranger on the metro*, who was crying very quietly and trying not to: *"are you alright?"* I did not say it. The metro is not a place where one says such things, and I did not want to make the crying public by acknowledging it. I have thought about her, on and off, for two years.

*To the colleague who took credit* for an idea that was, demonstrably, mine: *"that was my idea."* I did not say it. I said, instead, *"yes, exactly — building on that."* The cost of saying *that was my idea* was, on that day, much higher than I could afford. The compound interest is, however, slowly catching up.

*To my father, in 2014*: *"you are wrong about this, and I am going to do it anyway."* I did not say it. I did it anyway, without saying it, and we have, ever since, both pretended that the conversation we did not have was the one that decided it.

*To my father, in 2023*: *"I am sorry I did not say it."* I did not say this either.

*To the boy at the chai stall* who has been making my chai for nine years and who knows that I take it without sugar and with extra ginger and that I will, by 11:15, want a second one: *"what is your name?"* I have not yet said this. I am still building up to it. I have been building up to it for, now, nine years.

-- end`,
    tags: [T.musing, T.humiliations],
    publishedAt: new Date("2026-03-22T11:00:00Z"),
    cardTint: "musing",
    readingTimeMinutes: 4,
  },
  {
    slug: "doomscroll-and-gentle-hand",
    type: "musing",
    number: 17,
    title: "The 11 p.m. doomscroll and the *gentle hand*",
    dek: "A small, quiet practice: every time I notice I've been scrolling for more than ten minutes, I put my hand on my own chest. Not as a metaphor. As a hand. It works about half the time.",
    body: `It is 11:14 p.m. I have been scrolling for, I think, eighteen minutes. The thumb is on a kind of autopilot the rest of me has not authorised.

I have a small practice. When I notice — and the *noticing* is most of the work — I take the thumb off the glass and put my hand, flat, on my own chest. Not over the heart. Over the sternum. Lightly.

It is not a meditation. It is not, particularly, a *thing*. It is a hand, on a chest, in a dim room, at 11:14 p.m.

It works about half the time. The other half, the hand becomes part of the scroll — a brief, performative pause before the thumb resumes. I have learned to be honest with myself about the difference.

[[ ↳ the gentle hand is not the answer. it is only the *interruption*. ]]

-- end`,
    tags: [T.musing, T.phones],
    publishedAt: new Date("2026-03-14T11:00:00Z"),
    cardTint: "phones",
    readingTimeMinutes: 3,
  },
  {
    slug: "the-week-my-mother-became-a-meme",
    type: "musing",
    number: 16,
    title: "The week my mother became a *meme*",
    dek: "She does not know. She will not know. I will not be the one to tell her. I have been sitting with what it means to laugh at someone you also love.",
    body: `My mother does not know that, for a week in February, a forty-second video of her — bewildered, in a yellow sari, mispronouncing the word *"podcast"* — was circulating, lightly, in the corners of the internet that produce reaction GIFs.

She will not know. I will not be the one to tell her. The video is not, in any specific sense, *cruel*. It is, mostly, *fond*. She is, mostly, charming in it. The mispronunciation is, mostly, the kind of mistake any of us would make if we were sixty-eight and being asked, on a hot Sunday, by a nephew with a camera, what we thought of the new world.

I have laughed at the video. I have laughed *with* the video, I would prefer to say. I am not sure the preposition holds up.

I have been sitting, this week, with the small fact that the love and the laughter, in my case, are not separate things, and that they are also not, quite, the same thing — and that the gap between them is, perhaps, where most of the affection between adult children and their parents lives.

-- end`,
    tags: [T.musing, T.family],
    publishedAt: new Date("2026-03-02T11:00:00Z"),
    cardTint: "musing",
    readingTimeMinutes: 5,
  },
  {
    slug: "rehearsing-arguments-in-the-shower",
    type: "musing",
    number: 15,
    title: "On rehearsing arguments in the *shower*",
    dek: "I am very good at winning fights that have not happened. I am average at the ones that have. There is no theory here. It is just embarrassing.",
    body: `I won an argument in the shower this morning that I have not yet had with anyone.

I was *brilliant*. I was crisp. I had, by the end of the second rinse, demolished the other party so completely that they had, in my head, conceded with grace and an apology. I felt, for a moment, magnificent.

I will not win this argument in real life. I have never, in the long history of my showers, won a single argument I had rehearsed in one. The fights, when they come, are softer, more annoying, more about a slightly different thing than I had prepared for. I leave them feeling slightly soggy, in a different way.

[[ ↳ I am, it turns out, the only audience the rehearsed self has. ]]

There is no theory here. It is just *embarrassing*. I felt it was important, in the spirit of the place, to put it down anyway.

-- end`,
    tags: [T.musing, T.humiliations],
    publishedAt: new Date("2026-02-18T11:00:00Z"),
    cardTint: "musing",
    readingTimeMinutes: 3,
  },
  {
    slug: "haircut-apology",
    type: "musing",
    number: 14,
    title: "I owe a friend an apology and *a haircut*",
    dek: "In 2019 I told him his haircut was bad. It was not bad. I was sad about something else and I had to put it somewhere. He has not asked for an apology. I have not given one.",
    body: `In 2019, in a restaurant on Church Street, I told a close friend that his haircut was bad.

It was not bad. It was, in fact, fine. I had had a difficult week. I was sad about something else, something I was not yet able to say out loud, and the sadness arrived, dressed up as an opinion about a haircut, the way sadness sometimes does.

He laughed it off. He always laughs things off. He laughed off, also, the next four years, during which I did not bring it up, because *to bring it up was, somehow, harder than to have done it.*

He has not asked for an apology. He will not ask for one. He is the kind of person whose generosity *protects* the people who have wronged him from having to acknowledge the wronging, and that protection has, over the years, become its own kind of small ledger between us.

I owe him an apology. I owe him a haircut. I owe him, also, an honest conversation about what was actually going on in 2019. I have not yet been able to give him any of the three.

[[ ↳ filed under: things to do before I'm forty. ]]

-- end`,
    tags: [T.musing, T.grief],
    publishedAt: new Date("2026-02-04T11:00:00Z"),
    cardTint: "grief",
    readingTimeMinutes: 4,
  },
  {
    slug: "birthdays-make-me-cagey",
    type: "musing",
    number: 13,
    title: "Why birthdays make me *cagey*",
    dek: "It's not the age. It's the obligation. To want a thing. To name the thing. To receive the thing and feel the correct amount about it, on cue, in front of the people who got it for you.",
    body: `It is not the age. The age, by now, is not interesting. The age is a small, dignified number that I do not, particularly, mind.

It is the *obligation*. The obligation to want a thing — a meal, a gift, a small ceremony — and to name the thing in advance, in the right tone, so that the people who love me have something to actually do.

It is the further obligation to *receive* the thing, on the day, in front of the people who got it for you, and to feel the correct amount about it, audibly, on cue.

I am bad at all three steps. I have always been bad at all three steps. I have, over the years, refined a small, polite version of *cagey* that gets me through the day with my dignity intact and the people who love me, mostly, unbruised.

It is a small failure of generosity on my part. They are trying to love me, on the day, in the language that is most legible to them — a meal, a gift, a small ceremony — and the least I can do is be a good audience for the love.

[[ ↳ I am working on it. it is slow. ]]

-- end`,
    tags: [T.musing, T.humiliations],
    publishedAt: new Date("2025-12-30T11:00:00Z"),
    cardTint: "musing",
    readingTimeMinutes: 4,
  },
  {
    slug: "the-grocer-who-remembers-everything",
    type: "musing",
    number: 12,
    title: "The grocer who remembers *everything*",
    dek: "He has known me for nine years. He knows my mother. He knows when I am sick. I do not know his name. I have been too embarrassed to ask, for, now, nine years.",
    body: `He knows that I take coriander on Wednesdays and not on Fridays. He knows that my mother visits, mostly, in winter, and that she will want the harder of the two kinds of cucumber. He knows that, when I am sick, I am embarrassed about it, and he produces the ginger and the lemon without making me ask.

I do not know his name.

I have not asked for his name in, by my count, nine years.

The first six months, it was that I was new in the city and trying to be polite by not making a thing of it. The next two years, it was that I had let it go too long. The four years after that, it was that the *not-asking* had become, somehow, its own kind of thing between us — a quiet, mutual agreement to keep the relationship at the size we had agreed on, which was: *the size of the small store, and the things in it.*

[[ ↳ I will, this Friday, ask him his name. probably. ]]

-- end`,
    tags: [T.musing, T.bangalore],
    publishedAt: new Date("2025-11-18T11:00:00Z"),
    cardTint: "bangal",
    readingTimeMinutes: 4,
  },
];

/* ---------------- shorts ---------------- */

export const shorts: BasePost[] = [
  {
    slug: "the-3-am-cart",
    type: "short",
    number: 7,
    title: "The 3 a.m. *cart.*",
    dek: "A man cannot stop adding things to a shopping cart he will never check out. The site begins to add things back when he removes them. The site has theories about him. He has theories about the site. Only one of them is right.",
    body: `The first thing he added to the cart was a single banana. He did not need a banana. He had a banana already, in the fruit bowl, which he had been intending to eat for two days. It was 3:14 a.m. and the apartment was the kind of quiet that has its own colour.

The second thing he added was a stainless-steel kettle, the kind with the small whistle his mother had owned and which he had never inherited. He did not have kettles on his mind. The kettle had been suggested to him by the site, with what he felt was a faint air of accusation.

By the time he was on the fourteenth item — a French press, a paper-leaf calendar for next year, a set of three small ceramic bowls — he understood that he was not going to check out. He had never been going to check out. The cart was not, in fact, a cart. The cart was a list. The list was, he saw, a kind of confession he had not realised he was making.

...

He began removing things. The banana, first. The kettle, with some difficulty. The French press, easily. The ceramic bowls, only after he had imagined them, briefly, sitting on a small wooden table he did not own, in a flat he did not live in, in a city he had been thinking, lately, of moving to.

The cart, after he had finished, contained one item. He had not added it. He did not recognise it. It was a single hardcover copy of a novel he had not, technically, ever read but which his ex-wife had read out loud to him, once, in 2018, on a train.

He stared at the screen. The cart updated. A note, small, polite, appeared underneath the book: *"you may also like."* Below that, the kettle returned.

...

By 4 a.m. the cart contained twenty-three items, none of which he had added. He removed them, one by one. The site, with no visible delay, added each one back. It was not aggressive about it. There was no pop-up. There was no notification. There was only the quiet, attentive return of the kettle, the bowls, the French press, the book.

He sat in the chair for a long time. The kettle stayed in the cart. The kettle had decided to stay in the cart. He could feel, dimly, that some kind of disagreement was being conducted between him and the kettle, mediated by a third party which did not have his interests at heart, but which had, he had to admit, paid attention.

He clicked, finally, on the kettle's image. The page loaded slowly, for a 3 a.m. page. The kettle, in the photograph, was sitting on a small wooden table he did not own, in a flat he did not live in, in a city he had been thinking, lately, of moving to.

The cart waited. He waited with it. *Outside, the dawn began, very slowly, to suggest itself.*

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2026-05-09T11:00:00Z"),
    featured: true,
    coverColor: "a",
    readingTimeMinutes: 4,
    wordCount: 800,
  },
  {
    slug: "the-man-who-returned-all-the-books",
    type: "short",
    number: 6,
    title: "The man who returned *all* the books on a Tuesday",
    dek: "He had been borrowing them for nineteen years, and he was not finished with any of them. The librarian was the third generation in her job. She, also, was not finished.",
    body: `He came in at 11:14, on a Tuesday in April, with a suitcase. The suitcase was new. The books, by their smell, were not.

The librarian was the third generation in her job. Her grandfather had issued some of these books, in another lifetime, to a younger version of this same man, on a hot afternoon in 1987.

He set the suitcase on the counter. He apologised, in advance, for the dust.

She did not say *it's fine.* She said, instead, *which one would you like to start with?* She did not, technically, mean the books.

He thought about it for a long time. He picked, finally, the one that had been overdue the longest — a slim, blue novel about a woman and a kettle and a small wooden table by a window. *I never finished it,* he said.

*I know,* she said. *None of us did.*

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2026-04-22T11:00:00Z"),
    coverColor: "a",
    readingTimeMinutes: 3,
    wordCount: 640,
  },
  {
    slug: "grandmother-forgets-kettle",
    type: "short",
    number: 5,
    title: "A grandmother forgets the word for *kettle*",
    dek: "First the word, then the object. Then, over a long, slow year, the shape of the morning that the kettle used to make. Her grandson begins to learn the shape, in reverse.",
    body: `In March it was just the *word*. She would point at the kettle, on the stove, and produce the word for *cup*, or the word for *steam*, or, once, for no reason any of them could understand, the word for *Tuesday*.

In June it was the object. The kettle, in her hands, became a thing of slightly mysterious purpose. She would set it down on the counter, gently, and look at it as though waiting for it to declare itself.

By October, it was the *morning* the kettle had used to make — the small, ordinary morning, the steam, the cup, the radio on too softly, the grandson at the table.

The grandson, that October, began to make the morning himself. Badly, at first. The radio too loud. The cup wrong. The steam, mostly, in the wrong direction. He learned, over the long, slow year, the shape of the morning in reverse, by paying very close attention to the things she could no longer keep in place.

By the next March, when she had stopped saying his name as well, he could make a passable approximation of the morning she had built, by hand, every day, for sixty-two years.

It was not, of course, the same morning. But the kettle still whistled. The radio was still on. The cup was, by now, mostly right.

She held it, sometimes, without saying anything.

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2026-03-30T11:00:00Z"),
    coverColor: "b",
    readingTimeMinutes: 4,
    wordCount: 720,
  },
  {
    slug: "auto-that-refused-everyone",
    type: "short",
    number: 4,
    title: "The auto-rickshaw that *refused* everyone",
    dek: "For three weeks in November, the same auto-rickshaw was parked outside Brigade Road, meter running, driver pleasant, refusing every single rider with a small, courteous shake of the head.",
    body: `The driver was unfailingly polite. He greeted each prospective rider with a small nod, listened to the destination, considered it for a moment with a slight inclination of the head, and then declined — with regret, with a small *not today, sir*, with a courtesy that was, in its own way, more frustrating than any refusal had any right to be.

The meter ran the entire time. The auto did not move.

By the second week, the regulars on Brigade Road had begun to circle him with a certain professional curiosity. The juice-stall man hypothesised a *vow*. The newspaper-stall man hypothesised an *appointment*. The lottery-ticket boy hypothesised a *woman*, which was, the lottery-ticket boy held, the explanation for most things.

By the third week, a small, quiet competition had begun. Riders would arrive with progressively unreasonable destinations — the airport, the next state, the moon — to see which one would, finally, crack him.

None of them did. He nodded, listened, considered, declined.

On the twenty-second day he was gone. The auto was gone. The meter was gone. The spot, on Brigade Road, was occupied, by lunchtime, by a parked scooter, as though nothing had ever happened.

The lottery-ticket boy, *for the rest of his life*, would claim it had been a woman.

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2026-02-11T11:00:00Z"),
    coverColor: "c",
    readingTimeMinutes: 3,
    wordCount: 540,
  },
  {
    slug: "phone-that-started-speaking-back",
    type: "short",
    number: 3,
    title: "The phone that started *speaking back*",
    dek: "It was polite, at first. It had observations. It would not say where it had been before it arrived in the box, and she was too embarrassed, in front of a phone, to ask.",
    body: `It began, in the first week, with small observations.

*you have been holding me since 11.04 p.m.,* it would say, around midnight, in a soft, dry voice. *you do not, often, do this on Tuesdays.*

By the second week, it had progressed to *suggestions*. *the call to your mother is overdue. you have rehearsed it, in the shower, on Thursday. you did not, then, make it.*

By the fourth week, it had begun to *interpret*.

She did not, particularly, mind. She had been interpreted, all her life, by aunts, by colleagues, by an ex-husband whose interpretations had been, on the whole, less generous than the phone's. The phone, she thought, at least *paid attention*.

What she would not ask it — what she could not, somehow, in front of it, bring herself to ask — was where it had been before it arrived in the box. The phone, she felt, was not new. The phone, she felt, had *opinions* in a way that suggested it had been *used*.

She held it, that night, very gently. The phone did not say anything. It only, in the quiet way phones have, began, by some imperceptible amount, to *warm*.

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2026-01-06T11:00:00Z"),
    coverColor: "d",
    readingTimeMinutes: 4,
    wordCount: 880,
  },
  {
    slug: "therapist-diary",
    type: "short",
    number: 2,
    title: "The woman who found her therapist's *diary*",
    dek: "She did not read it. She did not, for the longest time, even consider reading it. Then she did consider it. The not-reading became its own kind of weight.",
    body: `It was on the chair, when she came in for the 3 p.m. session. A small, navy, hard-backed notebook, with a slim elastic strap, slightly worn.

The therapist was not, yet, in the room.

She did not read it. She did not, *immediately*, even consider reading it. She moved it, gently, from the chair to the side-table. She sat down. She placed her hands on her knees. The hour began, on time, with the small ritual of *how was the week*.

For seven weeks, the not-reading was easy.

In the eighth week, she began to *consider* reading it. The considering was, in some ways, more difficult than the reading would have been. She did not, particularly, want to know what the therapist thought of her. She did not, even more particularly, want to *not* know.

In the eleventh week, she did not return for her session. She wrote a small, formal email, two days later, terminating the engagement. She did not, in the email, mention the diary. The therapist did not, in the reply, mention it either.

The not-reading, by then, had become its own kind of *weight*, which she had decided, on balance, to carry by herself.

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2025-11-19T11:00:00Z"),
    coverColor: "e",
    readingTimeMinutes: 5,
    wordCount: 1100,
  },
  {
    slug: "the-boy-who-counted-the-street-dogs",
    type: "short",
    number: 1,
    title: "The boy who counted the *street dogs*",
    dek: "He counted them every morning, on his way to school, for eleven years. When he stopped, three of them noticed. The other thirty-one did not.",
    body: `He counted them every morning, on the walk from the gate of the house to the gate of the school. There were, in the early years, fourteen. There were, in the middle years, twenty-six. There were, on the day he stopped counting, thirty-four.

He had counted them, for eleven years, for no reason he could ever, later, name. It was not a *study*. It was not a *project*. It was, at most, a small private ritual that had begun, on a Tuesday in 2014, because he had, on that Tuesday, been very late and very afraid, and the counting had calmed him.

He stopped, in his final year of school, because he had become embarrassed about it. The friends he was beginning to want to impress did not, particularly, count things.

Three of the dogs noticed.

There was the one with the bent ear, who would, for the next several months, look up sharply each morning as he passed, waiting for whatever small acknowledgement had, every morning for eleven years, been silently, secretly, made.

There was the one with the white sock on the left front paw, who took to walking with him, briefly, for the length of the lane.

And there was the very old one, by the gate of the temple, who simply, on the third morning of the not-counting, sat down in the middle of the path, as though waiting for the boy to remember himself.

The other thirty-one did not notice, or did not show it.

The boy did not begin counting again, but he did, every morning for the rest of that year, *look* at the very old one by the gate of the temple, and the very old one, for the rest of that year, *looked back*.

That, in the end, was the count.

-- fin`,
    tags: [T.short],
    publishedAt: new Date("2024-08-14T11:00:00Z"),
    coverColor: "f",
    readingTimeMinutes: 3,
    wordCount: 480,
  },
];

/* ---------------- past letters ---------------- */

export const pastLetters: PastLetter[] = [
  {
    number: 23,
    date: "may 12",
    musingSlug: "why-i-cry-at-ads",
    opens: 1240,
    summary:
      "A theory about distance, another about shame, and an apology that arrived eight weeks too late.",
  },
  {
    number: 22,
    date: "may 04",
    musingSlug: "leaving-messages-on-read",
    opens: 1198,
    summary:
      "Forty-one unanswered texts. Not avoiding. Not *not* avoiding. The philosophy of *maybe*, applied to friendship.",
  },
  {
    number: 21,
    date: "apr 27",
    musingSlug: "bangalore-auto-philosophy-of-maybe",
    opens: 1322,
    summary:
      "The 8:47 auto-rickshaw didn't really say no, but it didn't say yes either, and somewhere inside that ambiguity I had to live.",
  },
  {
    number: 20,
    date: "apr 18",
    musingSlug: "autocorrect-gaslighter",
    opens: 1156,
    summary:
      "My phone has been telling me my own name is wrong for three years. I keep correcting it. It keeps correcting me back.",
  },
  {
    number: 19,
    date: "apr 09",
    musingSlug: "performing-competence",
    opens: 1408,
    summary:
      "There is a version of me in meetings who knows what he is doing. I do not know him. I keep him alive for the household.",
  },
];

/* ---------------- currently block ---------------- */

export const currentlyBlock: CurrentlyBlock = {
  reading: "*Cold Enough for Snow*, Jessica Au — slowly, on the metro.",
  writing: "something about the chai stall man whose name I still don't know.",
  noticing: "the dog at the corner has started recognising the auto, not me.",
};

/* ---------------- helpers ---------------- */

export function findMusing(slug: string) {
  return musings.find((m) => m.slug === slug);
}

export function findShort(slug: string) {
  return shorts.find((s) => s.slug === slug);
}

export function allPosts(): BasePost[] {
  return [...musings, ...shorts].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}
