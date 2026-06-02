export interface ServiceTime {
  time: string;
  name: string;
  when?: string;
  note?: string;
  description?: string;
}

// Standing service pattern (from the live site). Used by /worship/sundays,
// /worship/weekdays and as the ThisSunday fallback when no music sheet is published.
export const serviceTimes: { sundays: ServiceTime[]; weekdays: ServiceTime[] } = {
  sundays: [
    {
      time: '10.30am',
      name: 'Sung Mass',
      note: "with Children's Church (ages 5–9) and a Youth Group (ages 10–16)",
      description:
        'Our main service — around an hour and a quarter — combining choral music, the depth of the liturgy and accessible preaching, with groups for every age.',
    },
    {
      time: '10.30am',
      name: 'Noisy Mass',
      note: 'in the small hall — ages 0–4 and their carers, with Stay & Play',
      description:
        'A short, lively and interactive service for under-5s, with the Eucharist offered, followed by toys and time to play.',
    },
    {
      time: '8.00am',
      name: 'Said Mass (BCP)',
      when: 'first Sunday of the month',
      description:
        'A reflective, contemplative service of about 45 minutes in the language of the 1662 Book of Common Prayer, with a short sermon.',
    },
    {
      time: '6.00pm',
      name: 'Choral Evensong',
      when: 'first Sunday of the month',
      description: 'Sung psalms, canticles and hymns to close the day.',
    },
  ],
  weekdays: [
    {
      time: '12.30pm',
      name: 'Midweek Mass',
      when: 'Wednesdays',
      note: 'in the Lady Chapel — enter by the south door',
      description:
        'A reflective communion service for midweek refreshment, often drawing on the deep Celtic tradition of Christianity.',
    },
    {
      time: '12.00pm',
      name: 'Dementia-Friendly Worship',
      when: 'Thursdays',
      note: 'in church, following the Memory Café',
      description:
        'A very short, gentle time of prayer, designed especially for those who struggle with their memory.',
    },
    {
      time: '9.30am',
      name: 'Morning Prayer',
      when: 'Tuesday, Wednesday & Thursday',
      note: 'in the Lady Chapel — enter by the south door',
      description:
        'Praying the Daily Office to begin the day — about 20 minutes of scripture and prayer for the world and ourselves.',
    },
  ],
};
