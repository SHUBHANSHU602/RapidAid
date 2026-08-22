/**
 * General first aid based purely on emergency type.
 * Hardcoded — no AI, no network call, always instant.
 * Fires for every emergency regardless of description.
 */

const generalFirstAid = {
  CARDIAC: {
    title: 'Heart Emergency — Do This Now',
    steps: [
      'Ask the person to sit or lie down immediately',
      'Loosen any tight clothing around neck and chest',
      'If person becomes unresponsive — begin CPR: 30 chest compressions',
      'Do not give food, water, or medication',
      'Stay with the person until ambulance arrives',
    ],
    warnings: ['Do not leave the person alone', 'Do not let them exert themselves'],
  },
  STROKE: {
    title: 'Stroke Emergency — Do This Now',
    steps: [
      'Keep the person completely still and calm',
      'Note the exact time symptoms started',
      'Do not give food or water',
      'If unconscious, place them on their side',
      'Talk to them calmly and monitor breathing',
    ],
    warnings: ['Do not give aspirin unless prescribed', 'Do not let them sleep until help arrives'],
  },
  ACCIDENT: {
    title: 'Accident — Do This Now',
    steps: [
      'Ensure the scene is safe before approaching',
      'Do not move the person unless in immediate danger',
      'Apply firm pressure to bleeding wounds with clean cloth',
      'Keep the person warm with a jacket or blanket',
      'Talk to them to keep them conscious',
    ],
    warnings: ['Do not remove embedded objects', 'Do not give anything to drink'],
  },
  SNAKE_BITE: {
    title: 'Snake Bite — Do This Now',
    steps: [
      'Keep the person completely still — movement spreads venom',
      'Keep the bitten limb below heart level',
      'Remove any tight items near the bite (rings, watches)',
      'Do not try to suck out or cut the venom',
      'Note the time of bite and describe the snake if possible',
    ],
    warnings: ['Do not apply tourniquet', 'Do not apply ice or heat', 'Do not give alcohol'],
  },
  BREATHING: {
    title: 'Breathing Problem — Do This Now',
    steps: [
      'Help the person sit upright — never lay them flat',
      'Loosen any tight clothing around chest and neck',
      'Ask them to breathe slowly and deeply',
      'If they have an inhaler, help them use it',
      'Keep them calm — panic makes breathing worse',
    ],
    warnings: ['Do not give water during an attack', 'Do not leave them alone'],
  },
  HEAD_INJURY: {
    title: 'Head Injury — Do This Now',
    steps: [
      'Keep the person still — do not move them',
      'If bleeding, apply gentle pressure with clean cloth',
      'Do not remove any object embedded in the head',
      'Keep them awake and talking if possible',
      'Watch for vomiting, confusion, or unequal pupils',
    ],
    warnings: ['Do not give aspirin or ibuprofen', 'Do not let them fall asleep immediately'],
  },
  BURNS: {
    title: 'Burns — Do This Now',
    steps: [
      'Cool the burn with cool (not cold) running water for 10-20 minutes',
      'Remove clothing near the burn — but not if stuck to skin',
      'Cover loosely with a clean non-fluffy material',
      'Do not break any blisters',
      'Keep the person warm to prevent shock',
    ],
    warnings: ['Do not use ice, butter, or toothpaste', 'Do not use fluffy cotton wool'],
  },
  POISONING: {
    title: 'Poisoning — Do This Now',
    steps: [
      'Do not make the person vomit unless instructed by medical staff',
      'If conscious, note what they consumed and when',
      'Keep them calm and still',
      'If unconscious, place them on their side',
      'Bring the poison container to show the doctor',
    ],
    warnings: ['Do not give milk or water unless told to', 'Do not induce vomiting for acid or alkali'],
  },
  PREGNANCY: {
    title: 'Pregnancy Emergency — Do This Now',
    steps: [
      'Help the person lie on their left side',
      'Keep them calm and reassured',
      'Do not give food or water',
      'Note the time contractions started if relevant',
      'Keep them warm and comfortable',
    ],
    warnings: ['Do not let them stand or walk if in severe pain', 'Do not delay — call for help immediately'],
  },
  FIRE: {
    title: 'Fire/Smoke Emergency — Do This Now',
    steps: [
      'Get away from smoke and heat immediately',
      'Stay low to the ground where air is cleaner',
      'If clothing is on fire — stop, drop, and roll',
      'Cool any burns with running water',
      'Do not re-enter the building',
    ],
    warnings: ['Do not use lifts', 'Do not open hot doors'],
  },
  TRAUMA: {
    title: 'Trauma — Do This Now',
    steps: [
      'Do not move the person unless in danger',
      'Control bleeding by applying firm pressure',
      'Keep the person still and warm',
      'Talk to them calmly to monitor consciousness',
      'Note any changes in breathing or consciousness',
    ],
    warnings: ['Do not remove embedded objects', 'Do not give anything to eat or drink'],
  },
  RESPIRATORY: {
    title: 'Respiratory Emergency — Do This Now',
    steps: [
      'Sit the person upright immediately',
      'Loosen all tight clothing',
      'Help them use their inhaler if available',
      'Encourage slow steady breathing',
      'Stay with them and keep them calm',
    ],
    warnings: ['Do not lay them flat', 'Do not leave alone'],
  },
  NEUROLOGICAL: {
    title: 'Neurological Emergency — Do This Now',
    steps: [
      'Keep the person completely still',
      'Clear the area of sharp or hard objects',
      'Do not restrain seizure movements',
      'Turn them on their side after seizure stops',
      'Note exactly when symptoms started',
    ],
    warnings: ['Do not put anything in their mouth', 'Do not give food or water'],
  },
  OTHER: {
    title: 'Emergency — Stay Calm',
    steps: [
      'Keep the person calm and still',
      'Do not give food or water',
      'Monitor their breathing every 2 minutes',
      'Keep them warm with a blanket or jacket',
      'Stay with them until ambulance arrives',
    ],
    warnings: ['Do not move the person unless in immediate danger'],
  },
};

/**
 * Get general first aid for an emergency type.
 * Always returns something — never null.
 * @param {string} emergencyType
 * @returns {{ title: string, steps: string[], warnings: string[] }}
 */
function getGeneralFirstAid(emergencyType) {
  return generalFirstAid[emergencyType] || generalFirstAid.OTHER;
}

module.exports = { getGeneralFirstAid };